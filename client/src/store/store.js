import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminUserReducer from './slices/adminUserSlice';
import adminCoinReducer from './slices/adminCoinSlice';
import adminPackageReducer from './slices/adminPackageSlice';
import dashboardReducer from './slices/dashboardSlice';
import withdrawalReducer from './slices/withdrawalSlice';
import packageReducer from './slices/packageSlice';
import supportChatReducer from './slices/supportChatSlice';

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
  },
});

export default store;
