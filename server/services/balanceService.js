import BalanceAccount from '../models/BalanceAccount.js';
import Transaction from '../models/Transaction.js';
import Transfer from '../models/Transfer.js';
import ApiError from '../utils/ApiError.js';
import { toPaise, toRupees } from '../utils/money.js';
import { keyToDate, todayKey } from '../utils/dates.js';
import { ACCOUNTS, ACCOUNT_METHODS } from '../config/constants.js';

const sumOf = (rows, id) => rows.find((r) => r._id === id)?.total || 0;

// current = opening + income - expenses + transfers in - transfers out (all from openingDate onwards)
const computeAccountsPaise = async () => {
  const stored = await BalanceAccount.find();
  const result = [];
  for (const accountType of ACCOUNTS) {
    const acc = stored.find((a) => a.accountType === accountType);
    const openingBalance = acc?.openingBalance || 0;
    const openingDate = acc?.openingDate || '1970-01-01';

    const [txnRows, outRows, inRows] = await Promise.all([
      Transaction.aggregate([
        { $match: { paymentMethod: { $in: ACCOUNT_METHODS[accountType] }, dateKey: { $gte: openingDate } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
      Transfer.aggregate([
        { $match: { fromAccount: accountType, dateKey: { $gte: openingDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transfer.aggregate([
        { $match: { toAccount: accountType, dateKey: { $gte: openingDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const income = sumOf(txnRows, 'income');
    const expense = sumOf(txnRows, 'expense');
    const transferOut = outRows[0]?.total || 0;
    const transferIn = inRows[0]?.total || 0;
    result.push({
      accountType,
      openingBalance,
      openingDate,
      income,
      expense,
      transferIn,
      transferOut,
      currentBalance: openingBalance + income - expense + transferIn - transferOut,
    });
  }
  return result;
};

export const getBalances = async () => {
  const accounts = await computeAccountsPaise();
  const byType = Object.fromEntries(accounts.map((a) => [a.accountType, a.currentBalance]));
  return {
    accounts: accounts.map((a) => ({
      accountType: a.accountType,
      openingBalance: toRupees(a.openingBalance),
      openingDate: a.openingDate,
      income: toRupees(a.income),
      expense: toRupees(a.expense),
      transferIn: toRupees(a.transferIn),
      transferOut: toRupees(a.transferOut),
      currentBalance: toRupees(a.currentBalance),
    })),
    totals: {
      cash: toRupees(byType.cash),
      online: toRupees(byType.upi + byType.bank),
      total: toRupees(byType.cash + byType.upi + byType.bank),
    },
  };
};

export const setOpeningBalance = async ({ accountType, openingBalance, openingDate }, userId) => {
  const date = openingDate || todayKey();
  const paise = toPaise(openingBalance);
  await BalanceAccount.findOneAndUpdate(
    { accountType },
    {
      $set: { openingBalance: paise, openingDate: date },
      $push: { history: { openingBalance: paise, openingDate: date, setBy: userId, setAt: new Date() } },
    },
    { upsert: true, new: true }
  );
  return getBalances();
};

export const createTransfer = async (data, userId) => {
  const { fromAccount, toAccount, note, idempotencyKey } = data;
  if (fromAccount === toAccount) throw new ApiError(400, 'Choose two different accounts');

  if (idempotencyKey) {
    const existing = await Transfer.findOne({ idempotencyKey });
    if (existing) return existing;
  }

  const amount = toPaise(data.amount);
  const accounts = await computeAccountsPaise();
  const source = accounts.find((a) => a.accountType === fromAccount);
  if (source.currentBalance < amount) {
    throw new ApiError(400, `Not enough balance in ${fromAccount}. Set the opening balance first if you haven't.`);
  }

  const dateKey = data.transferDate || todayKey();
  try {
    return await Transfer.create({
      fromAccount,
      toAccount,
      amount,
      note: note || undefined,
      dateKey,
      transferDate: keyToDate(dateKey),
      createdBy: userId,
      idempotencyKey: idempotencyKey || undefined,
    });
  } catch (err) {
    if (err.code === 11000 && idempotencyKey) return Transfer.findOne({ idempotencyKey });
    throw err;
  }
};

export const getHistory = async () => {
  const [transfers, accounts] = await Promise.all([
    Transfer.find().sort({ dateKey: -1, createdAt: -1 }).limit(100),
    BalanceAccount.find(),
  ]);

  const items = [];
  for (const t of transfers) {
    items.push({
      kind: 'transfer',
      id: t._id,
      date: t.dateKey,
      createdAt: t.createdAt,
      fromAccount: t.fromAccount,
      toAccount: t.toAccount,
      amount: toRupees(t.amount),
      note: t.note || '',
    });
  }
  for (const acc of accounts) {
    for (const h of acc.history) {
      items.push({
        kind: 'opening',
        id: h._id,
        date: h.openingDate,
        createdAt: h.setAt,
        accountType: acc.accountType,
        amount: toRupees(h.openingBalance),
      });
    }
  }
  items.sort((a, b) => (a.date === b.date ? new Date(b.createdAt) - new Date(a.createdAt) : a.date < b.date ? 1 : -1));
  return items;
};
