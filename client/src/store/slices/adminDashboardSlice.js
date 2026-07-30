import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAdminDashboardStats = createAsyncThunk(
  'adminDashboard/fetchAdminDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateSystemStatusThunk = createAsyncThunk(
  'adminDashboard/updateSystemStatus',
  async (statusData, { rejectWithValue }) => {
    try {
      const response = await api.put('/admin/dashboard/system-status', statusData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const adminDashboardSlice = createSlice({
  name: 'adminDashboard',
  initialState: {
    statsData: {
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        activePackages: 0,
        pendingApprovals: 0,
        platformLiquidity: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
      },
      activityTrend: [],
      depositTrend: [],
      systemStatus: {
        maintenanceMode: false,
        newRegistrations: true,
        withdrawalProcessing: true,
      },
      recentRegistrations: [],
      platformTransactions: [],
    },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.statsData = action.payload.data;
      })
      .addCase(fetchAdminDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateSystemStatusThunk.fulfilled, (state, action) => {
        state.statsData.systemStatus = action.payload.data;
      });
  },
});

export default adminDashboardSlice.reducer;
