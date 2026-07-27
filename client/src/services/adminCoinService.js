import api from './api';

const adminCoinService = {
  list: (params) => api.get('/admin/coins', { params }),
  get: (id) => api.get(`/admin/coins/${id}`),
  create: (data) => api.post('/admin/coins', data),
  update: (id, data) => api.patch(`/admin/coins/${id}`, data),
  toggleStatus: (id) => api.patch(`/admin/coins/${id}/toggle`),
  delete: (id) => api.delete(`/admin/coins/${id}`),
};

export default adminCoinService;
