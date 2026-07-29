import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // Wait, let's verify if the services/api or utils/api is used. In other slices, what is used?

export const fetchMiningSettings = createAsyncThunk(
  'adminMiningSettings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/mining-settings');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch settings');
    }
  }
);

export const updateMiningSettings = createAsyncThunk(
  'adminMiningSettings/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put('/admin/mining-settings', settings);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update settings');
    }
  }
);

export const fetchUserPackages = createAsyncThunk(
  'adminMiningSettings/fetchUserPackages',
  async (userId = '', { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/user-packages${userId ? `?userId=${userId}` : ''}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch user packages');
    }
  }
);

export const updateUserPackage = createAsyncThunk(
  'adminMiningSettings/updateUserPackage',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/user-packages/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update user package');
    }
  }
);

const adminMiningSettingsSlice = createSlice({
  name: 'adminMiningSettings',
  initialState: {
    settings: {
      timerDuration: 24,
      isPaused: false,
      isDisabled: false,
    },
    userPackages: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearStatus: (state) => {
      state.success = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchMiningSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMiningSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchMiningSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update settings
      .addCase(updateMiningSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateMiningSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        state.success = true;
      })
      .addCase(updateMiningSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch user packages
      .addCase(fetchUserPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.userPackages = action.payload;
      })
      .addCase(fetchUserPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update user package
      .addCase(updateUserPackage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUserPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Update user package in state
        const idx = state.userPackages.findIndex(pkg => pkg._id === action.payload._id);
        if (idx !== -1) {
          state.userPackages[idx] = {
            ...state.userPackages[idx],
            ...action.payload
          };
        }
      })
      .addCase(updateUserPackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearStatus } = adminMiningSettingsSlice.actions;
export default adminMiningSettingsSlice.reducer;
