import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardService from '../../services/dashboardService';

export const fetchDashboardSummary = createAsyncThunk(
  'dashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getSummary();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to load dashboard.' });
    }
  }
);

export const claimMiningPayout = createAsyncThunk(
  'dashboard/claimMiningPayout',
  async (userPackageId, { dispatch, rejectWithValue }) => {
    try {
      const response = await dashboardService.claimReward(userPackageId);
      dispatch(fetchDashboardSummary());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to claim reward.' });
    }
  }
);

export const fetchMyDeposits = createAsyncThunk(
  'dashboard/fetchMyDeposits',
  async (params, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getMyDeposits(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch deposits.' });
    }
  }
);

export const fetchMyTransactions = createAsyncThunk(
  'dashboard/fetchMyTransactions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getMyTransactions(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch transactions.' });
    }
  }
);

export const fetchMyReferrals = createAsyncThunk(
  'dashboard/fetchMyReferrals',
  async (params, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getMyReferrals(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch referrals.' });
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    balances: {
      walletBalance: 0,
      referralBalance: 0,
      miningBalances: {},
    },
    walletAddresses: {},
    coins: [],
    referralLink: '',
    miningStatus: {
      status: 'inactive',
      progressPercent: 0,
      estToday: {},
      hashRate: 0,
    },
    activePackage: null,
    latestTransactions: [],
    miningSettings: {
      timerDuration: 24,
      isPaused: false,
      isDisabled: false,
    },
    history: {
      deposits: { data: [], total: 0, page: 1, limit: 20, loading: false, error: null },
      transactions: { data: [], total: 0, page: 1, limit: 20, loading: false, error: null },
      referrals: { data: [], total: 0, page: 1, limit: 20, loading: false, error: null },
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.balances = action.payload.balances;
        state.walletAddresses = action.payload.walletAddresses;
        state.coins = action.payload.coins;
        state.referralLink = action.payload.referralLink;
        state.miningStatus = action.payload.miningStatus;
        state.activePackage = action.payload.activePackage;
        state.latestTransactions = action.payload.latestTransactions;
        state.miningSettings = action.payload.miningSettings || { timerDuration: 24, isPaused: false, isDisabled: false };
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(claimMiningPayout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(claimMiningPayout.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(claimMiningPayout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyDeposits.pending, (state) => {
        state.history.deposits.loading = true;
        state.history.deposits.error = null;
      })
      .addCase(fetchMyDeposits.fulfilled, (state, action) => {
        state.history.deposits.loading = false;
        state.history.deposits.data = action.payload.deposits;
        state.history.deposits.total = action.payload.total;
        state.history.deposits.page = action.payload.page;
        state.history.deposits.limit = action.payload.limit;
      })
      .addCase(fetchMyDeposits.rejected, (state, action) => {
        state.history.deposits.loading = false;
        state.history.deposits.error = action.payload;
      })
      .addCase(fetchMyTransactions.pending, (state) => {
        state.history.transactions.loading = true;
        state.history.transactions.error = null;
      })
      .addCase(fetchMyTransactions.fulfilled, (state, action) => {
        state.history.transactions.loading = false;
        state.history.transactions.data = action.payload.transactions;
        state.history.transactions.total = action.payload.total;
        state.history.transactions.page = action.payload.page;
        state.history.transactions.limit = action.payload.limit;
      })
      .addCase(fetchMyTransactions.rejected, (state, action) => {
        state.history.transactions.loading = false;
        state.history.transactions.error = action.payload;
      })
      .addCase(fetchMyReferrals.pending, (state) => {
        state.history.referrals.loading = true;
        state.history.referrals.error = null;
      })
      .addCase(fetchMyReferrals.fulfilled, (state, action) => {
        state.history.referrals.loading = false;
        state.history.referrals.data = action.payload.referrals;
        state.history.referrals.total = action.payload.total;
        state.history.referrals.page = action.payload.page;
        state.history.referrals.limit = action.payload.limit;
      })
      .addCase(fetchMyReferrals.rejected, (state, action) => {
        state.history.referrals.loading = false;
        state.history.referrals.error = action.payload;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
