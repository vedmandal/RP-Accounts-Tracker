import { useContext } from 'react';
import { AuthContext, BalanceContext, CustomerContext, DashboardContext, ToastContext, TransactionContext } from '../context/contexts';

const make = (Context, name) => () => {
  const value = useContext(Context);
  if (value === null) throw new Error(`${name} must be used inside its provider`);
  return value;
};

export const useAuth = make(AuthContext, 'useAuth');
export const useToast = make(ToastContext, 'useToast');
export const useDashboard = make(DashboardContext, 'useDashboard');
export const useTransactions = make(TransactionContext, 'useTransactions');
export const useCustomers = make(CustomerContext, 'useCustomers');
export const useBalances = make(BalanceContext, 'useBalances');
