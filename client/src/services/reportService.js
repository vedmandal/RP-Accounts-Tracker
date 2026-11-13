import api, { clean } from './api';

export const getReport = async (mode, params) => (await api.get(`/reports/${mode}`, { params: clean(params) })).data;
