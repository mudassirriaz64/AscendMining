import api from './api';

const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
  claimReward: (userPackageId) => api.post(`/mining/claim/${userPackageId}`),
};

export default dashboardService;
