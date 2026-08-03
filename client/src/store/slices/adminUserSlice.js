import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from '../../services/adminService';

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.listUsers(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch users.' });
    }
  }
);

export const fetchUserDetail = createAsyncThunk(
  'admin/fetchUserDetail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.getUserDetail(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch user.' });
    }
  }
);

export const fetchUserPackages = createAsyncThunk(
  'admin/fetchUserPackages',
  async ({ id, params }, { rejectWithValue }) => {
    try {
      const response = await adminService.getUserPackages(id, params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch packages.' });
    }
  }
);

export const fetchUserDeposits = createAsyncThunk(
  'admin/fetchUserDeposits',
  async ({ id, params }, { rejectWithValue }) => {
    try {
      const response = await adminService.getUserDeposits(id, params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch deposits.' });
    }
  }
);

export const fetchUserWithdrawals = createAsyncThunk(
  'admin/fetchUserWithdrawals',
  async ({ id, params }, { rejectWithValue }) => {
    try {
      const response = await adminService.getUserWithdrawals(id, params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch withdrawals.' });
    }
  }
);

export const fetchUserScreenshots = createAsyncThunk(
  'admin/fetchUserScreenshots',
  async ({ id, params }, { rejectWithValue }) => {
    try {
      const response = await adminService.getUserScreenshots(id, params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch screenshots.' });
    }
  }
);

export const suspendUser = createAsyncThunk(
  'admin/suspendUser',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await adminService.suspendUser(id, reason);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to suspend user.' });
    }
  }
);

export const reactivateUser = createAsyncThunk(
  'admin/reactivateUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.reactivateUser(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to reactivate user.' });
    }
  }
);

export const triggerPasswordReset = createAsyncThunk(
  'admin/triggerPasswordReset',
  async ({ id, newPassword }, { rejectWithValue }) => {
    try {
      const response = await adminService.triggerPasswordReset(id, { newPassword });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to reset password.' });
    }
  }
);

export const adjustUserBalance = createAsyncThunk(
  'admin/adjustUserBalance',
  async ({ id, type, amount, reason }, { rejectWithValue }) => {
    try {
      const response = await adminService.adjustUserBalance(id, { type, amount, reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to adjust user balance.' });
    }
  }
);

const adminUserSlice = createSlice({
  name: 'adminUsers',
  initialState: {
    users: [],
    usersTotal: 0,
    usersPage: 1,
    usersLimit: 20,
    userDetail: null,
    userPackages: { packages: [], total: 0 },
    userDeposits: { deposits: [], total: 0 },
    userWithdrawals: { withdrawals: [], total: 0 },
    userScreenshots: { screenshots: [], total: 0 },
    loading: false,
    tabLoading: false,
    error: null,
    actionSuccess: null,
  },
  reducers: {
    clearAdminError: (state) => { state.error = null; },
    clearActionSuccess: (state) => { state.actionSuccess = null; },
    resetUserDetail: (state) => {
      state.userDetail = null;
      state.userPackages = { packages: [], total: 0 };
      state.userDeposits = { deposits: [], total: 0 };
      state.userWithdrawals = { withdrawals: [], total: 0 };
      state.userScreenshots = { screenshots: [], total: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchUsers.fulfilled, (s, a) => {
        s.loading = false;
        s.users = a.payload.users;
        s.usersTotal = a.payload.total;
        s.usersPage = a.payload.page;
        s.usersLimit = a.payload.limit;
      })
      .addCase(fetchUsers.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchUserDetail.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchUserDetail.fulfilled, (s, a) => { s.loading = false; s.userDetail = a.payload.user; })
      .addCase(fetchUserDetail.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchUserPackages.pending, (s) => { s.tabLoading = true; })
      .addCase(fetchUserPackages.fulfilled, (s, a) => { s.tabLoading = false; s.userPackages = a.payload; })
      .addCase(fetchUserPackages.rejected, (s) => { s.tabLoading = false; })

      .addCase(fetchUserDeposits.pending, (s) => { s.tabLoading = true; })
      .addCase(fetchUserDeposits.fulfilled, (s, a) => { s.tabLoading = false; s.userDeposits = a.payload; })
      .addCase(fetchUserDeposits.rejected, (s) => { s.tabLoading = false; })

      .addCase(fetchUserWithdrawals.pending, (s) => { s.tabLoading = true; })
      .addCase(fetchUserWithdrawals.fulfilled, (s, a) => { s.tabLoading = false; s.userWithdrawals = a.payload; })
      .addCase(fetchUserWithdrawals.rejected, (s) => { s.tabLoading = false; })

      .addCase(fetchUserScreenshots.pending, (s) => { s.tabLoading = true; })
      .addCase(fetchUserScreenshots.fulfilled, (s, a) => { s.tabLoading = false; s.userScreenshots = a.payload; })
      .addCase(fetchUserScreenshots.rejected, (s) => { s.tabLoading = false; })

      .addCase(suspendUser.fulfilled, (s) => { s.actionSuccess = 'User suspended successfully.'; })
      .addCase(suspendUser.rejected, (s, a) => { s.error = a.payload; })

      .addCase(reactivateUser.fulfilled, (s) => { s.actionSuccess = 'User reactivated successfully.'; })
      .addCase(reactivateUser.rejected, (s, a) => { s.error = a.payload; })

      .addCase(triggerPasswordReset.fulfilled, (s) => { s.actionSuccess = 'Password reset successfully.'; })
      .addCase(triggerPasswordReset.rejected, (s, a) => { s.error = a.payload; })

      .addCase(adjustUserBalance.fulfilled, (s, a) => {
        s.actionSuccess = a.payload.message || 'Balance adjusted successfully.';
        if (s.userDetail) {
          s.userDetail.walletBalance = a.payload.data.walletBalance;
        }
      })
      .addCase(adjustUserBalance.rejected, (s, a) => { s.error = a.payload; });
  },
});

export const { clearAdminError, clearActionSuccess, resetUserDetail } = adminUserSlice.actions;
export default adminUserSlice.reducer;
