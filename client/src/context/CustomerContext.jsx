import { CustomerContext } from './contexts';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import customerReducer, { initialCustomerState } from '../reducers/customerReducer';
import { CUSTOMER } from '../reducers/actionTypes';
import * as customerService from '../services/customerService';
import { useAuth, useToast, useTransactions } from '../hooks/useContexts';


export const CustomerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(customerReducer, initialCustomerState);
  const { user } = useAuth();
  const { notify } = useToast();
  const transactions = useTransactions();

  // Full customer list for dropdowns. Reloaded only when customers or credit data change.
  useEffect(() => {
    if (!user) {
      dispatch({ type: CUSTOMER.CLEAR });
      return;
    }
    customerService
      .getCustomers({ limit: 1000 })
      .then(({ data }) => dispatch({ type: CUSTOMER.SET_OPTIONS, payload: data }))
      .catch(() => {});
  }, [user, state.version]);

  const invalidateCustomers = useCallback(() => dispatch({ type: CUSTOMER.INVALIDATE }), []);

  // Credit changes also create income records and move balances.
  const invalidateAll = useCallback(() => {
    invalidateCustomers();
    transactions.invalidate();
  }, [invalidateCustomers, transactions]);

  const addCustomer = useCallback(
    async (payload) => {
      const res = await customerService.createCustomer(payload);
      notify('Customer added');
      invalidateCustomers();
      return res.data;
    },
    [notify, invalidateCustomers]
  );

  const editCustomer = useCallback(
    async (id, payload) => {
      await customerService.updateCustomer(id, payload);
      notify('Customer updated');
      invalidateCustomers();
    },
    [notify, invalidateCustomers]
  );

  const removeCustomer = useCallback(
    async (id) => {
      await customerService.deleteCustomer(id);
      notify('Customer deleted');
      invalidateCustomers();
    },
    [notify, invalidateCustomers]
  );

  const addSale = useCallback(
    async (payload) => {
      const res = await customerService.createCreditSale(payload);
      notify('Credit sale recorded');
      invalidateAll();
      return res.data;
    },
    [notify, invalidateAll]
  );

  const addPayment = useCallback(
    async (payload) => {
      const res = await customerService.addCreditPayment(payload);
      notify(res.data.duplicate ? 'This payment was already saved' : 'Payment received');
      invalidateAll();
      return res.data;
    },
    [notify, invalidateAll]
  );

  const removePayment = useCallback(
    async (id) => {
      await customerService.deleteCreditPayment(id);
      notify('Payment reversed');
      invalidateAll();
    },
    [notify, invalidateAll]
  );

  const value = useMemo(
    () => ({ ...state, addCustomer, editCustomer, removeCustomer, addSale, addPayment, removePayment }),
    [state, addCustomer, editCustomer, removeCustomer, addSale, addPayment, removePayment]
  );
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
};
