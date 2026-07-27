import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminUserReducer from './slices/adminUserSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    adminUsers: adminUserReducer,
  },
});

export default store;
