import Transaction from '../models/Transaction.js';
import { todayKey, monthRange } from '../utils/dates.js';
import { buildMatch, summarize, monthlySeries } from './summaryService.js';
import { getBalances } from './balanceService.js';
import { creditSummary } from './creditService.js';

export const getSummary = async () => {
  const today = todayKey();
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const range = monthRange(year, month);

  const [todaySummary, monthSummary, monthlyChart, balances, pendingCredit] = await Promise.all([
    summarize(buildMatch({ start: today, end: today })),
    summarize(buildMatch({ start: range.start, end: range.end })),
    monthlySeries(year),
    getBalances(),
    creditSummary(),
  ]);

  return { date: today, today: todaySummary, month: monthSummary, monthlyChart, balances, pendingCredit };
};

export const getRecent = async (limit = 5) => {
  const find = (type) => Transaction.find({ type }).sort({ dateKey: -1, createdAt: -1, _id: -1 }).limit(limit);
  const [income, expense] = await Promise.all([find('income'), find('expense')]);
  return { income, expense };
};
