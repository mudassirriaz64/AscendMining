import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAdminDeposits = createAsyncThunk(
  'adminDeposits/fetchAll',
  async ({ page = 1, limit = 20, status = 'pending' } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/deposits', { params: { page, limit, status } });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: { message: 'Failed to fetch deposits' } });
    }
  }
);

export const approveAdminDeposit = createAsyncThunk(
  'adminDeposits/approve',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/deposits/${id}/approve`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: { message: 'Failed to approve deposit' } });
    }
  }
);

export const rejectAdminDeposit = createAsyncThunk(
  'adminDeposits/reject',
  async ({ id, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/deposits/${id}/reject`, { rejectionReason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: { message: 'Failed to reject deposit' } });
    }
  }
);

const initialState = {
  deposits: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
  actionSuccess: null,
};

const adminDepositSlice = createSlice({
  name: 'adminDeposits',
  initialState,
  reducers: {
    clearAdminDepositError: (state) => {
      state.error = null;
    },
    clearAdminDepositSuccess: (state) => {
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAdminDeposits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDeposits.fulfilled, (state, action) => {
        state.loading = false;
        state.deposits = action.payload.deposits;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchAdminDeposits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve
      .addCase(approveAdminDeposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveAdminDeposit.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = 'Deposit approved successfully.';
        // Remove from pending list
        state.deposits = state.deposits.filter((d) => d._id !== action.payload._id);
      })
      .addCase(approveAdminDeposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reject
      .addCase(rejectAdminDeposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectAdminDeposit.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = 'Deposit rejected successfully.';
        // Remove from pending list
        state.deposits = state.deposits.filter((d) => d._id !== action.payload._id);
      })
      .addCase(rejectAdminDeposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminDepositError, clearAdminDepositSuccess } = adminDepositSlice.actions;
export default adminDepositSlice.reducer;
