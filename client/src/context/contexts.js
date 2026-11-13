import { createContext } from 'react';

// Context objects live in one dependency-free file so providers and hooks never import each other in a cycle.
export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
export const DashboardContext = createContext(null);
export const TransactionContext = createContext(null);
export const CustomerContext = createContext(null);
export const BalanceContext = createContext(null);
