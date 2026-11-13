import Transaction from '../models/Transaction.js';
import { toRupees } from '../utils/money.js';
import { eachDay, MONTH_NAMES, yearRange } from '../utils/dates.js';

// Builds a MongoDB match filter from a dateKey range plus optional filters.
export const buildMatch = ({ start, end, type, paymentMethod, expenseType, category } = {}) => {
  const match = {};
  if (start || end) {
    match.dateKey = {};
    if (start) match.dateKey.$gte = start;
    if (end) match.dateKey.$lte = end;
  }
  if (type) match.type = type;
  if (paymentMethod) match.paymentMethod = paymentMethod;
  if (expenseType) match.expenseType = expenseType;
  if (category) match.category = category;
  return match;
};

// Totals for any match. "Online" means every payment method except Cash.
export const summarize = async (match) => {
  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: { type: '$type', method: '$paymentMethod' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  const s = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0, cashIncome: 0, onlineIncome: 0, cashExpense: 0, onlineExpense: 0 };
  const methods = {};

  for (const row of rows) {
    const { type, method } = row._id;
    const isCash = method === 'Cash';
    methods[method] = methods[method] || { method, income: 0, expense: 0 };
    methods[method][type] += row.total;
    if (type === 'income') {
      s.income += row.total;
      s.incomeCount += row.count;
      if (isCash) s.cashIncome += row.total;
      else s.onlineIncome += row.total;
    } else {
      s.expense += row.total;
      s.expenseCount += row.count;
      if (isCash) s.cashExpense += row.total;
      else s.onlineExpense += row.total;
    }
  }

  return {
    income: toRupees(s.income),
    expense: toRupees(s.expense),
    net: toRupees(s.income - s.expense),
    incomeCount: s.incomeCount,
    expenseCount: s.expenseCount,
    transactionCount: s.incomeCount + s.expenseCount,
    cashIncome: toRupees(s.cashIncome),
    onlineIncome: toRupees(s.onlineIncome),
    cashExpense: toRupees(s.cashExpense),
    onlineExpense: toRupees(s.onlineExpense),
    byMethod: Object.values(methods).map((m) => ({
      method: m.method,
      income: toRupees(m.income),
      expense: toRupees(m.expense),
    })),
  };
};

export const categoryBreakdown = async (match) => {
  const rows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: { type: '$type', category: '$category', expenseType: '$expenseType' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({
    type: r._id.type,
    category: r._id.category,
    expenseType: r._id.expenseType || null,
    total: toRupees(r.total),
    count: r.count,
  }));
};

// January..December totals for one year.
export const monthlySeries = async (year, extra = {}) => {
  const { start, end } = yearRange(year);
  const rows = await Transaction.aggregate([
    { $match: buildMatch({ start, end, ...extra }) },
    { $group: { _id: { m: { $substrBytes: ['$dateKey', 5, 2] }, type: '$type' }, total: { $sum: '$amount' } } },
  ]);
  const months = MONTH_NAMES.map((label, i) => ({
    key: `${year}-${String(i + 1).padStart(2, '0')}`,
    label,
    income: 0,
    expense: 0,
  }));
  for (const r of rows) months[Number(r._id.m) - 1][r._id.type] += r.total;
  return months.map((m) => ({ ...m, income: toRupees(m.income), expense: toRupees(m.expense), net: toRupees(m.income - m.expense) }));
};

// One entry per day between start and end (zero-filled).
export const dailySeries = async (start, end, extra = {}) => {
  const rows = await Transaction.aggregate([
    { $match: buildMatch({ start, end, ...extra }) },
    { $group: { _id: { d: '$dateKey', type: '$type' }, total: { $sum: '$amount' } } },
  ]);
  const map = {};
  for (const r of rows) {
    map[r._id.d] = map[r._id.d] || { income: 0, expense: 0 };
    map[r._id.d][r._id.type] += r.total;
  }
  return eachDay(start, end).map((key) => {
    const v = map[key] || { income: 0, expense: 0 };
    return {
      key,
      label: key.slice(8) + ' ' + MONTH_NAMES[Number(key.slice(5, 7)) - 1],
      income: toRupees(v.income),
      expense: toRupees(v.expense),
      net: toRupees(v.income - v.expense),
    };
  });
};
