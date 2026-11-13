import api, { clean } from './api';

export const getTransactions = async (params) => (await api.get('/transactions', { params: clean(params) })).data;
export const createTransaction = async (payload) => (await api.post('/transactions', payload)).data;
export const updateTransaction = async (id, payload) => (await api.put(`/transactions/${id}`, payload)).data;
export const deleteTransaction = async (id) => (await api.delete(`/transactions/${id}`)).data;
export const getDay = async (dateKey) => (await api.get(`/transactions/day/${dateKey}`)).data;
export const getCalendarMonth = async (year, month) => (await api.get('/transactions/calendar', { params: { year, month } })).data;
