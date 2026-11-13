import api from './api';

export const getSummary = async () => (await api.get('/dashboard/summary')).data;
export const getRecent = async (limit = 5) => (await api.get('/dashboard/recent-transactions', { params: { limit } })).data;
