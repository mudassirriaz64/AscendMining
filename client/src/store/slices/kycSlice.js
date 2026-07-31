import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const submitKYC = createAsyncThunk(
  'kyc/submitKYC',
  async (kycData, { rejectWithValue }) => {
    try {
      const response = await api.post('/kyc/submit', kycData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to submit KYC documents.');
    }
  }
);

export const fetchAdminKYCRequests = createAsyncThunk(
  'kyc/fetchAdminKYCRequests',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/kyc', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch pending KYC requests.');
    }
  }
);

export const approveUserKYC = createAsyncThunk(
  'kyc/approveUserKYC',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/kyc/${userId}/approve`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to approve KYC.');
    }
  }
);

export const rejectUserKYC = createAsyncThunk(
  'kyc/rejectUserKYC',
  async ({ userId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/kyc/${userId}/reject`, { reason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to reject KYC.');
    }
  }
);

const kycSlice = createSlice({
  name: 'kyc',
  initialState: {
    pendingRequests: [],
    requestsTotal: 0,
    requestsPage: 1,
    requestsLimit: 20,
    loading: false,
    error: null,
    success: false,
    actionSuccessMessage: null,
  },
  reducers: {
    clearKYCStatus: (state) => {
      state.success = false;
      state.error = null;
      state.actionSuccessMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Submit KYC
      .addCase(submitKYC.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitKYC.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.actionSuccessMessage = action.payload.message;
      })
      .addCase(submitKYC.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch admin pending requests
      .addCase(fetchAdminKYCRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminKYCRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRequests = action.payload.requests;
        state.requestsTotal = action.payload.total;
        state.requestsPage = action.payload.page;
        state.requestsLimit = action.payload.limit;
      })
      .addCase(fetchAdminKYCRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve KYC
      .addCase(approveUserKYC.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveUserKYC.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRequests = state.pendingRequests.filter(req => req._id !== action.payload._id);
        state.requestsTotal = Math.max(0, state.requestsTotal - 1);
        state.success = true;
        state.actionSuccessMessage = 'User KYC approved successfully!';
      })
      .addCase(approveUserKYC.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reject KYC
      .addCase(rejectUserKYC.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectUserKYC.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRequests = state.pendingRequests.filter(req => req._id !== action.payload._id);
        state.requestsTotal = Math.max(0, state.requestsTotal - 1);
        state.success = true;
        state.actionSuccessMessage = 'User KYC rejected successfully.';
      })
      .addCase(rejectUserKYC.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearKYCStatus } = kycSlice.actions;
export default kycSlice.reducer;
