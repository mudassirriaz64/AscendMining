import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAdminReferralSettings = createAsyncThunk(
  'adminReferrals/fetchAdminReferralSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/referrals/settings');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateAdminReferralSettings = createAsyncThunk(
  'adminReferrals/updateAdminReferralSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await api.put('/admin/referrals/settings', settingsData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAdminReferralRecords = createAsyncThunk(
  'adminReferrals/fetchAdminReferralRecords',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/referrals/records', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const adminReferralSlice = createSlice({
  name: 'adminReferrals',
  initialState: {
    settings: {
      isActive: true,
      bonusPercentage: 10,
    },
    records: [],
    stats: {
      totalReferrals: 0,
      totalBonusesPaid: 0,
    },
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
    actionSuccess: null,
  },
  reducers: {
    clearAdminReferralError: (state) => {
      state.error = null;
    },
    clearAdminReferralSuccess: (state) => {
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Settings
      .addCase(fetchAdminReferralSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReferralSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload.data.settings;
      })
      .addCase(fetchAdminReferralSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAdminReferralSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(updateAdminReferralSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        state.settings = action.payload.data.settings;
      })
      .addCase(updateAdminReferralSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Records
      .addCase(fetchAdminReferralRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReferralRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.data.referrals;
        state.stats = action.payload.data.stats;
        state.total = action.payload.data.pagination.total;
        state.page = action.payload.data.pagination.page;
      })
      .addCase(fetchAdminReferralRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminReferralError, clearAdminReferralSuccess } = adminReferralSlice.actions;
export default adminReferralSlice.reducer;
