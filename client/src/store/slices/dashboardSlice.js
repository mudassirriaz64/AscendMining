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
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
