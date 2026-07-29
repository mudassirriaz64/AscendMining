import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../utils/api';

export const fetchAdminWithdrawals = createAsyncThunk(
  'adminWithdrawals/fetchAdminWithdrawals',
  async ({ page = 1, limit = 20, status = '' }, { rejectWithValue }) => {
    try {
      const endpoint = status === 'pending' ? `/admin/withdrawals/pending` : `/admin/withdrawals`;
      const response = await api.get(endpoint, {
        params: { page, limit, status: status === 'pending' ? undefined : status },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const approveAdminWithdrawal = createAsyncThunk(
  'adminWithdrawals/approveAdminWithdrawal',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/withdrawals/${id}/approve`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const rejectAdminWithdrawal = createAsyncThunk(
  'adminWithdrawals/rejectAdminWithdrawal',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/withdrawals/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const adminWithdrawalSlice = createSlice({
  name: 'adminWithdrawals',
  initialState: {
    withdrawals: [],
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
    actionSuccess: null,
  },
  reducers: {
    clearAdminWithdrawalError: (state) => {
      state.error = null;
    },
    clearAdminWithdrawalSuccess: (state) => {
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminWithdrawals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminWithdrawals.fulfilled, (state, action) => {
        state.loading = false;
        state.withdrawals = action.payload.data.withdrawals;
        state.total = action.payload.data.pagination.total;
        state.page = action.payload.data.pagination.page;
      })
      .addCase(fetchAdminWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(approveAdminWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(approveAdminWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message || 'Withdrawal approved successfully';
      })
      .addCase(approveAdminWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(rejectAdminWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(rejectAdminWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message || 'Withdrawal rejected successfully';
      })
      .addCase(rejectAdminWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminWithdrawalError, clearAdminWithdrawalSuccess } = adminWithdrawalSlice.actions;
export default adminWithdrawalSlice.reducer;
