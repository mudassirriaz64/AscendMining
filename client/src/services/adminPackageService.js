import api from './api';

const adminPackageService = {
  list: (params) => api.get('/admin/packages', { params }),
  get: (id) => api.get(`/admin/packages/${id}`),
  create: (data) => api.post('/admin/packages', data),
  update: (id, data) => api.patch(`/admin/packages/${id}`, data),
  toggleStatus: (id) => api.patch(`/admin/packages/${id}/toggle`),
  delete: (id) => api.delete(`/admin/packages/${id}`),
  listCoins: () => api.get('/admin/coins', { params: { limit: 100 } }),
};

export default adminPackageService;
