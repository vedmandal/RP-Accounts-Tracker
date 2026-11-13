import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import ApiError from '../utils/ApiError.js';
import { toPaise } from '../utils/money.js';
import { keyToDate, monthRange, todayKey, yearRange } from '../utils/dates.js';
import { CREDIT_COLLECTION_CATEGORY } from '../config/constants.js';
import { summarize } from './summaryService.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildFilter = (q = {}) => {
  const f = {};
  if (q.type) f.type = q.type;
  if (q.paymentMethod) f.paymentMethod = q.paymentMethod;
  if (q.category) f.category = q.category;
  if (q.expenseType) f.expenseType = q.expenseType;

  if (q.date) {
    f.dateKey = q.date;
  } else if (q.startDate || q.endDate) {
    f.dateKey = {};
    if (q.startDate) f.dateKey.$gte = q.startDate;
    if (q.endDate) f.dateKey.$lte = q.endDate;
  } else if (q.year && q.month) {
    const r = monthRange(Number(q.year), Number(q.month));
    f.dateKey = { $gte: r.start, $lte: r.end };
  } else if (q.year) {
    const r = yearRange(Number(q.year));
    f.dateKey = { $gte: r.start, $lte: r.end };
  }

  if (q.search && q.search.trim()) {
    const re = new RegExp(escapeRegex(q.search.trim()), 'i');
    f.$or = [{ customerName: re }, { expenseName: re }, { paidTo: re }, { description: re }];
  }
  return f;
};

const resolveCategory = async (type, name) => {
  if (type === 'income' && name === CREDIT_COLLECTION_CATEGORY) {
    throw new ApiError(400, 'Credit collections are recorded from the Credit Management page');
  }
  const category = await Category.findOne({ name, type });
  if (!category) throw new ApiError(400, `Unknown ${type} category "${name}"`);
  return category;
};

const ensureManual = (txn) => {
  if (!txn) throw new ApiError(404, 'Transaction not found');
  if (txn.source !== 'manual') {
    throw new ApiError(400, 'This entry was created by the Credit Management module. Manage it from there.');
  }
};

export const createTransaction = async (data, userId) => {
  if (data.idempotencyKey) {
    const existing = await Transaction.findOne({ idempotencyKey: data.idempotencyKey });
    if (existing) return { transaction: existing, duplicate: true };
  }
  const category = await resolveCategory(data.type, data.category);
  const dateKey = data.transactionDate || todayKey();

  const payload = {
    type: data.type,
    amount: toPaise(data.amount),
    category: category.name,
    paymentMethod: data.paymentMethod,
    customerName: data.customerName || undefined,
    expenseName: data.type === 'expense' ? data.expenseName : undefined,
    paidTo: data.paidTo || undefined,
    description: data.description || undefined,
    dateKey,
    transactionDate: keyToDate(dateKey),
    expenseType: data.type === 'expense' ? category.expenseType : undefined,
    source: 'manual',
    createdBy: userId,
    idempotencyKey: data.idempotencyKey || undefined,
  };

  try {
    const transaction = await Transaction.create(payload);
    return { transaction, duplicate: false };
  } catch (err) {
    if (err.code === 11000 && data.idempotencyKey) {
      const existing = await Transaction.findOne({ idempotencyKey: data.idempotencyKey });
      if (existing) return { transaction: existing, duplicate: true };
    }
    throw err;
  }
};

export const updateTransaction = async (id, data) => {
  const txn = await Transaction.findById(id);
  ensureManual(txn);
  if (data.type && data.type !== txn.type) throw new ApiError(400, 'Transaction type cannot be changed');

  const category = await resolveCategory(txn.type, data.category || txn.category);
  const dateKey = data.transactionDate || txn.dateKey;

  txn.amount = toPaise(data.amount ?? txn.amount / 100);
  txn.category = category.name;
  txn.paymentMethod = data.paymentMethod || txn.paymentMethod;
  txn.customerName = data.customerName || undefined;
  txn.paidTo = data.paidTo || undefined;
  txn.description = data.description || undefined;
  txn.dateKey = dateKey;
  txn.transactionDate = keyToDate(dateKey);
  if (txn.type === 'expense') {
    txn.expenseName = data.expenseName || txn.expenseName;
    txn.expenseType = category.expenseType;
  }
  await txn.save();
  return txn;
};

export const deleteTransaction = async (id) => {
  const txn = await Transaction.findById(id);
  ensureManual(txn);
  await txn.deleteOne();
};

export const getTransaction = async (id) => {
  const txn = await Transaction.findById(id);
  if (!txn) throw new ApiError(404, 'Transaction not found');
  return txn;
};

export const listTransactions = async (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const filter = buildFilter(query);

  const [data, total, totals] = await Promise.all([
    Transaction.find(filter)
      .sort({ dateKey: -1, createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
    summarize(filter),
  ]);

  return { data, totals, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
};

// Everything entered on one calendar date.
export const getDay = async (dateKey) => {
  const filter = { dateKey };
  const [transactions, summary] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1, _id: -1 }),
    summarize(filter),
  ]);
  return { date: dateKey, transactions, summary };
};

// Per-day totals for one month, used for calendar markers.
export const getCalendarMonth = async (year, month) => {
  const { start, end } = monthRange(year, month);
  const rows = await Transaction.aggregate([
    { $match: { dateKey: { $gte: start, $lte: end } } },
    { $group: { _id: { d: '$dateKey', type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const days = {};
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    days[r._id.d] = days[r._id.d] || { income: 0, expense: 0, count: 0 };
    days[r._id.d][r._id.type] += r.total / 100;
    days[r._id.d].count += r.count;
    if (r._id.type === 'income') income += r.total;
    else expense += r.total;
  }
  Object.values(days).forEach((d) => {
    d.income = Math.round(d.income * 100) / 100;
    d.expense = Math.round(d.expense * 100) / 100;
  });
  return { days, summary: { income: income / 100, expense: expense / 100, net: (income - expense) / 100 } };
};
