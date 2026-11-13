import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardProvider } from './context/DashboardContext';
import { BalanceProvider } from './context/BalanceContext';
import { TransactionProvider } from './context/TransactionContext';
import { CustomerProvider } from './context/CustomerContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncomePage from './pages/IncomePage';
import ExpensesPage from './pages/ExpensesPage';
import CalendarPage from './pages/CalendarPage';
import CustomersPage from './pages/CustomersPage';
import CreditPage from './pages/CreditPage';
import BalancesPage from './pages/BalancesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import LandingPage from './pages/LandingPage';

// Provider order matters: inner providers use the outer ones to refresh data after changes.
const App = () => (
  <AuthProvider>
    <ToastProvider>
      <DashboardProvider>
        <BalanceProvider>
          <TransactionProvider>
            <CustomerProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route index element={<DashboardPage />} />
                    <Route path="income" element={<IncomePage />} />
                    <Route path="expenses" element={<ExpensesPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="credit" element={<CreditPage />} />
                    <Route path="balances" element={<BalancesPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </BrowserRouter>
            </CustomerProvider>
          </TransactionProvider>
        </BalanceProvider>
      </DashboardProvider>
    </ToastProvider>
  </AuthProvider>
);

export default App;
