import { useEffect, useMemo, useState } from 'react';
import { getTransactions } from '../services/transactionService';
import { getErrorMessage } from '../services/api';
import { useTransactions } from './useContexts';
import useDebounce from './useDebounce';
import { todayKey } from '../utils/format';

const PAGE_SIZE = 10;

// Filters + pagination + fetching for the Income and Expense pages.
const useTransactionList = (type) => {
  const { version } = useTransactions();
  const [filters, setFilters] = useState({
    search: '',
    paymentMethod: '',
    category: '',
    expenseType: '',
    period: 'all', // all | date | month | year
    date: todayKey(),
    month: todayKey().slice(0, 7),
    year: String(new Date().getFullYear()),
  });
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ items: [], pagination: null, totals: null, loading: true, error: null });
  const search = useDebounce(filters.search, 400);

  const setFilter = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
  };

  const params = useMemo(() => {
    const p = { type, page, limit: PAGE_SIZE, search, paymentMethod: filters.paymentMethod, category: filters.category };
    if (type === 'expense') p.expenseType = filters.expenseType;
    if (filters.period === 'date') p.date = filters.date;
    if (filters.period === 'month' && filters.month) {
      const [y, m] = filters.month.split('-');
      p.year = y;
      p.month = String(Number(m));
    }
    if (filters.period === 'year' && filters.year) p.year = filters.year;
    return p;
  }, [type, page, search, filters.paymentMethod, filters.category, filters.expenseType, filters.period, filters.date, filters.month, filters.year]);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    getTransactions(params)
      .then((res) => {
        if (!cancelled) setState({ items: res.data, pagination: res.pagination, totals: res.totals, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) }));
      });
    return () => {
      cancelled = true;
    };
  }, [params, version]);

  return { filters, setFilter, page, setPage, ...state };
};

export default useTransactionList;
