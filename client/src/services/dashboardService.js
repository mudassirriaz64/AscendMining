import api from './api';

const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
  claimReward: (userPackageId) => api.post(`/mining/claim/${userPackageId}`),
  getMyDeposits: (params) => api.get('/dashboard/deposits', { params }),
  getMyTransactions: (params) => api.get('/dashboard/transactions', { params }),
  getMyReferrals: (params) => api.get('/dashboard/referrals', { params }),
};

export default dashboardService;
