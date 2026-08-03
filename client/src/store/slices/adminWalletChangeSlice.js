import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Fetch all wallet change requests (admin view), with status filter and pagination.
 */
export const fetchAdminWalletRequests = createAsyncThunk(
  'adminWalletRequests/fetchAll',
  async ({ page = 1, limit = 20, status = 'pending' } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/wallet-requests', { params: { page, limit, status } });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: { message: 'Failed to fetch wallet requests.' } });
    }
  }
);

/**
 * Approve a wallet address change request.
 */
export const approveAdminWalletRequest = createAsyncThunk(
  'adminWalletRequests/approve',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/wallet-requests/${id}/approve`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: { message: 'Failed to approve request.' } });
    }
  }
);

/**
 * Reject a wallet address change request with a rejection reason.
 */
export const rejectAdminWalletRequest = createAsyncThunk(
  'adminWalletRequests/reject',
  async ({ id, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/wallet-requests/${id}/reject`, { rejectionReason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: { message: 'Failed to reject request.' } });
    }
  }
);

const adminWalletChangeSlice = createSlice({
  name: 'adminWalletRequests',
  initialState: {
    requests: [],
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
    actionSuccess: null,
  },
  reducers: {
    clearAdminWalletError: (state) => {
      state.error = null;
    },
    clearAdminWalletSuccess: (state) => {
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAdminWalletRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminWalletRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests;
        state.total = action.payload.pagination.total;
        state.page = action.payload.pagination.page;
      })
      .addCase(fetchAdminWalletRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve
      .addCase(approveAdminWalletRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveAdminWalletRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = 'Wallet address change approved successfully.';
        // Remove from pending list
        const approvedId = action.payload.request?._id;
        if (approvedId) {
          state.requests = state.requests.filter((r) => r._id !== approvedId);
          state.total = Math.max(0, state.total - 1);
        }
      })
      .addCase(approveAdminWalletRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reject
      .addCase(rejectAdminWalletRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectAdminWalletRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = 'Wallet address change request rejected.';
        // Remove from pending list
        const rejectedId = action.payload.request?._id;
        if (rejectedId) {
          state.requests = state.requests.filter((r) => r._id !== rejectedId);
          state.total = Math.max(0, state.total - 1);
        }
      })
      .addCase(rejectAdminWalletRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminWalletError, clearAdminWalletSuccess } = adminWalletChangeSlice.actions;
export default adminWalletChangeSlice.reducer;
