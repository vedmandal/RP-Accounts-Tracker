import { TransactionContext } from './contexts';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import transactionReducer, { initialTransactionState } from '../reducers/transactionReducer';
import { TXN } from '../reducers/actionTypes';
import * as transactionService from '../services/transactionService';
import * as categoryService from '../services/categoryService';
import { useAuth, useBalances, useDashboard, useToast } from '../hooks/useContexts';


export const TransactionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialTransactionState);
  const { user } = useAuth();
  const { notify } = useToast();
  const dashboard = useDashboard();
  const balances = useBalances();

  const loadCategories = useCallback(async () => {
    const { data } = await categoryService.getCategories();
    dispatch({ type: TXN.SET_CATEGORIES, payload: data });
  }, []);

  useEffect(() => {
    if (user) loadCategories().catch(() => {});
    else dispatch({ type: TXN.CLEAR });
  }, [user, loadCategories]);

  // After any change to money records: refresh lists, dashboard and balances.
  const invalidate = useCallback(() => {
    dispatch({ type: TXN.INVALIDATE });
    dashboard.invalidate();
    balances.invalidate();
  }, [dashboard, balances]);

  const createTransaction = useCallback(
    async (payload) => {
      const res = await transactionService.createTransaction(payload);
      notify(res.duplicate ? 'This entry was already saved' : `${payload.type === 'income' ? 'Income' : 'Expense'} added`);
      invalidate();
      return res.data;
    },
    [notify, invalidate]
  );

  const updateTransaction = useCallback(
    async (id, payload) => {
      const res = await transactionService.updateTransaction(id, payload);
      notify('Transaction updated');
      invalidate();
      return res.data;
    },
    [notify, invalidate]
  );

  const deleteTransaction = useCallback(
    async (id) => {
      await transactionService.deleteTransaction(id);
      notify('Transaction deleted');
      invalidate();
    },
    [notify, invalidate]
  );

  const addCategory = useCallback(
    async (payload) => {
      await categoryService.createCategory(payload);
      await loadCategories();
      notify('Category added');
    },
    [loadCategories, notify]
  );

  const removeCategory = useCallback(
    async (id) => {
      await categoryService.deleteCategory(id);
      await loadCategories();
      notify('Category deleted');
    },
    [loadCategories, notify]
  );

  const value = useMemo(
    () => ({ ...state, invalidate, createTransaction, updateTransaction, deleteTransaction, addCategory, removeCategory }),
    [state, invalidate, createTransaction, updateTransaction, deleteTransaction, addCategory, removeCategory]
  );
  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};
