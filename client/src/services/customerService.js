import api, { clean } from './api';

export const getCustomers = async (params) => (await api.get('/customers', { params: clean(params) })).data;
export const createCustomer = async (payload) => (await api.post('/customers', payload)).data;
export const updateCustomer = async (id, payload) => (await api.put(`/customers/${id}`, payload)).data;
export const deleteCustomer = async (id) => (await api.delete(`/customers/${id}`)).data;

export const createCreditSale = async (payload) => (await api.post('/credit/sales', payload)).data;
export const getCreditSales = async (params) => (await api.get('/credit/sales', { params: clean(params) })).data;
export const addCreditPayment = async (payload) => (await api.post('/credit/payments', payload)).data;
export const deleteCreditPayment = async (id) => (await api.delete(`/credit/payments/${id}`)).data;
export const getCustomerCredit = async (id) => (await api.get(`/credit/customers/${id}`)).data;
export const getCreditSummary = async () => (await api.get('/credit/summary')).data;
