import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminUserReducer from './slices/adminUserSlice';
import adminCoinReducer from './slices/adminCoinSlice';
import adminPackageReducer from './slices/adminPackageSlice';
import dashboardReducer from './slices/dashboardSlice';
import withdrawalReducer from './slices/withdrawalSlice';
import packageReducer from './slices/packageSlice';
import supportChatReducer from './slices/supportChatSlice';
import adminDepositReducer from './slices/adminDepositSlice';
import adminWithdrawalReducer from './slices/adminWithdrawalSlice';
import adminPaymentMethodReducer from './slices/adminPaymentMethodSlice';
import adminFaqReducer from './slices/adminFaqSlice';
import adminServiceReducer from './slices/adminServiceSlice';
import adminContactMessageReducer from './slices/adminContactMessageSlice';
import adminReferralReducer from './slices/adminReferralSlice';
import adminDashboardStatsReducer from './slices/adminDashboardSlice';
import notificationReducer from './slices/notificationSlice';
import adminMiningSettingsReducer from './slices/adminMiningSettingsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    adminUsers: adminUserReducer,
    adminCoins: adminCoinReducer,
    adminPackages: adminPackageReducer,
    dashboard: dashboardReducer,
    withdrawal: withdrawalReducer,
    package: packageReducer,
    supportChat: supportChatReducer,
    notifications: notificationReducer,
    adminMiningSettings: adminMiningSettingsReducer,
    adminDeposits: adminDepositReducer,
    adminWithdrawals: adminWithdrawalReducer,
    adminPaymentMethods: adminPaymentMethodReducer,
    adminFAQs: adminFaqReducer,
    adminServices: adminServiceReducer,
    adminContactMessages: adminContactMessageReducer,
    adminReferrals: adminReferralReducer,
    adminDashboardStats: adminDashboardStatsReducer,
  },
});

export default store;
