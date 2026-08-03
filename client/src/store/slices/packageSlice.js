import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { fetchDashboardSummary } from './dashboardSlice';
import { checkAuth } from './authSlice';

export const fetchPackages = createAsyncThunk(
  'package/fetchPackages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/packages');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to load plans.' });
    }
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'package/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payment-methods');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to load payment methods.' });
    }
  }
);

export const fetchUserMiningTracks = createAsyncThunk(
  'package/fetchUserMiningTracks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/mining/tracks');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to load mining tracks.' });
    }
  }
);

export const purchasePlan = createAsyncThunk(
  'package/purchasePlan',
  async (purchaseData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/packages/purchase', purchaseData);
      dispatch(fetchDashboardSummary());
      dispatch(checkAuth());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to submit purchase request.' });
    }
  }
);

export const submitDeposit = createAsyncThunk(
  'package/submitDeposit',
  async (depositData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/deposits', depositData);
      dispatch(fetchDashboardSummary());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to submit deposit request.' });
    }
  }
);

const packageSlice = createSlice({
  name: 'package',
  initialState: {
    packages: [],
    paymentMethods: [],
    tracks: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearPackageError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Packages
      .addCase(fetchPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.packages = action.payload;
      })
      .addCase(fetchPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Payment Methods
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentMethods = action.payload;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch User Tracks
      .addCase(fetchUserMiningTracks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserMiningTracks.fulfilled, (state, action) => {
        state.loading = false;
        state.tracks = action.payload;
      })
      .addCase(fetchUserMiningTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Purchase Plan
      .addCase(purchasePlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(purchasePlan.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(purchasePlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit Deposit
      .addCase(submitDeposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitDeposit.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitDeposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPackageError } = packageSlice.actions;
export default packageSlice.reducer;
