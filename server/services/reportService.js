import Transaction from '../models/Transaction.js';
import { buildMatch, summarize, categoryBreakdown, monthlySeries, dailySeries } from './summaryService.js';
import { dayCount, monthRange, yearRange, MONTH_NAMES } from '../utils/dates.js';

const TXN_LIMIT = 1000;

const pickFilters = (q = {}) => ({ type: q.type, paymentMethod: q.paymentMethod, expenseType: q.expenseType });

const loadTransactions = async (match) => {
  const rows = await Transaction.find(match).sort({ dateKey: -1, createdAt: -1, _id: -1 }).limit(TXN_LIMIT + 1);
  return { transactions: rows.slice(0, TXN_LIMIT), truncated: rows.length > TXN_LIMIT };
};

const assemble = async ({ mode, title, start, end, filters, series, withTransactions }) => {
  const match = buildMatch({ start, end, ...filters });
  const [summary, byCategory, seriesData, txns] = await Promise.all([
    summarize(match),
    categoryBreakdown(match),
    series(),
    withTransactions ? loadTransactions(match) : { transactions: [], truncated: false },
  ]);
  return { mode, title, range: { start, end }, summary, byCategory, series: seriesData, ...txns };
};

export const dailyReport = (q) =>
  assemble({
    mode: 'daily',
    title: `Daily Report – ${q.date}`,
    start: q.date,
    end: q.date,
    filters: pickFilters(q),
    series: async () => [],
    withTransactions: true,
  });

export const monthlyReport = (q) => {
  const year = Number(q.year);
  const month = Number(q.month);
  const { start, end } = monthRange(year, month);
  const filters = pickFilters(q);
  return assemble({
    mode: 'monthly',
    title: `Monthly Report – ${MONTH_NAMES[month - 1]} ${year}`,
    start,
    end,
    filters,
    series: () => dailySeries(start, end, filters),
    withTransactions: true,
  });
};

export const yearlyReport = (q) => {
  const year = Number(q.year);
  const { start, end } = yearRange(year);
  const filters = pickFilters(q);
  return assemble({
    mode: 'yearly',
    title: `Yearly Report – ${year}`,
    start,
    end,
    filters,
    series: () => monthlySeries(year, filters),
    withTransactions: false,
  });
};

export const customReport = (q) => {
  const filters = pickFilters(q);
  const useMonths = dayCount(q.startDate, q.endDate) > 92;
  return assemble({
    mode: 'custom',
    title: `Report – ${q.startDate} to ${q.endDate}`,
    start: q.startDate,
    end: q.endDate,
    filters,
    series: async () => {
      if (!useMonths) return dailySeries(q.startDate, q.endDate, filters);
      // Long ranges: group by month across the years involved.
      const years = [];
      for (let y = Number(q.startDate.slice(0, 4)); y <= Number(q.endDate.slice(0, 4)); y += 1) years.push(y);
      const all = (await Promise.all(years.map((y) => monthlySeries(y, filters)))).flat();
      const startKey = q.startDate.slice(0, 7);
      const endKey = q.endDate.slice(0, 7);
      return all
        .filter((m) => m.key >= startKey && m.key <= endKey)
        .map((m) => ({ ...m, label: `${m.label} ${m.key.slice(2, 4)}` }));
    },
    withTransactions: true,
  });
};
