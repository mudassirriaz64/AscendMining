import api from './api';

const adminService = {
  listUsers: (params) => api.get('/admin/users', { params }),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  getUserPackages: (id, params) => api.get(`/admin/users/${id}/packages`, { params }),
  getUserDeposits: (id, params) => api.get(`/admin/users/${id}/deposits`, { params }),
  getUserWithdrawals: (id, params) => api.get(`/admin/users/${id}/withdrawals`, { params }),
  getUserScreenshots: (id, params) => api.get(`/admin/users/${id}/screenshots`, { params }),
  suspendUser: (id, reason) => api.patch(`/admin/users/${id}/suspend`, { reason }),
  reactivateUser: (id) => api.patch(`/admin/users/${id}/reactivate`),
  triggerPasswordReset: (id, data) => api.post(`/admin/users/${id}/reset-password`, data),
  adjustUserBalance: (id, data) => api.post(`/admin/users/${id}/adjust-balance`, data),
  getAuditLogs: (params) => api.get('/admin/logs', { params }),
};

export default adminService;
