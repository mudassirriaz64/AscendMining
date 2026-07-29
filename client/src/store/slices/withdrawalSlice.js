import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { fetchDashboardSummary } from './dashboardSlice';

export const fetchWithdrawals = createAsyncThunk(
  'withdrawal/fetchWithdrawals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/withdrawals');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to load withdrawals.' });
    }
  }
);

export const requestWithdrawal = createAsyncThunk(
  'withdrawal/requestWithdrawal',
  async ({ coinSymbol, amount }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/withdrawals/request', { coinSymbol, amount });
      dispatch(fetchDashboardSummary());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to submit withdrawal request.' });
    }
  }
);

export const updateWalletAddress = createAsyncThunk(
  'withdrawal/updateWalletAddress',
  async ({ coinSymbol, address }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/wallets/update', { coinSymbol, address });
      dispatch(fetchDashboardSummary());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update wallet address.' });
    }
  }
);

const withdrawalSlice = createSlice({
  name: 'withdrawal',
  initialState: {
    withdrawals: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearWithdrawalError: (state) => {
      state.error = null;
    },
    updateWithdrawalStatus: (state, action) => {
      const updated = action.payload;
      const idx = state.withdrawals.findIndex((w) => w._id === updated._id);
      if (idx !== -1) {
        state.withdrawals[idx] = { ...state.withdrawals[idx], ...updated };
      }
    },
    addWithdrawal: (state, action) => {
      const withdrawal = action.payload;
      if (withdrawal && withdrawal._id && !state.withdrawals.some((w) => w._id === withdrawal._id)) {
        state.withdrawals = [withdrawal, ...state.withdrawals];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Withdrawals
      .addCase(fetchWithdrawals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawals.fulfilled, (state, action) => {
        state.loading = false;
        state.withdrawals = action.payload;
      })
      .addCase(fetchWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Request Withdrawal
      .addCase(requestWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestWithdrawal.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Wallet Address
      .addCase(updateWalletAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWalletAddress.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateWalletAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWithdrawalError, updateWithdrawalStatus, addWithdrawal } = withdrawalSlice.actions;
export default withdrawalSlice.reducer;
