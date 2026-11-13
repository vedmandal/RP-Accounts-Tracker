import api from './api';

export const login = async (email, password) => (await api.post('/auth/login', { email, password })).data;
export const register = async (payload) => (await api.post('/auth/register', payload)).data;
export const getMe = async () => (await api.get('/auth/me')).data;
export const getSetupStatus = async () => (await api.get('/auth/setup-status')).data;
