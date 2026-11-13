import api from './api';

export const getBalances = async () => (await api.get('/balances')).data;
export const getBalanceHistory = async () => (await api.get('/balances/history')).data;
export const setOpeningBalance = async (payload) => (await api.post('/balances/opening', payload)).data;
export const createTransfer = async (payload) => (await api.post('/balances/transfer', payload)).data;
