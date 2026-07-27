import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminPackageService from '../../services/adminPackageService';

export const fetchAdminPackages = createAsyncThunk(
  'adminPackages/fetchPackages',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminPackageService.list(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch packages.' });
    }
  }
);

export const fetchAdminPackageDetail = createAsyncThunk(
  'adminPackages/fetchPackageDetail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminPackageService.get(id);
      return response.data.data.package;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch package.' });
    }
  }
);

export const createAdminPackage = createAsyncThunk(
  'adminPackages/createPackage',
  async (data, { rejectWithValue }) => {
    try {
      const response = await adminPackageService.create(data);
      return response.data.data.package;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create package.' });
    }
  }
);

export const updateAdminPackage = createAsyncThunk(
  'adminPackages/updatePackage',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await adminPackageService.update(id, data);
      return response.data.data.package;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update package.' });
    }
  }
);

export const toggleAdminPackageStatus = createAsyncThunk(
  'adminPackages/togglePackageStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminPackageService.toggleStatus(id);
      return response.data.data.package;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to toggle package status.' });
    }
  }
);

export const fetchAllCoins = createAsyncThunk(
  'adminPackages/fetchAllCoins',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminPackageService.listCoins();
      return response.data.data.coins;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch coins.' });
    }
  }
);

const adminPackageSlice = createSlice({
  name: 'adminPackages',
  initialState: {
    packages: [],
    packagesTotal: 0,
    packagesPage: 1,
    packagesLimit: 20,
    packageDetail: null,
    allCoins: [],
    loading: false,
    error: null,
    actionSuccess: null,
  },
  reducers: {
    clearPackageError: (state) => {
      state.error = null;
    },
    clearPackageActionSuccess: (state) => {
      state.actionSuccess = null;
    },
    resetPackageDetail: (state) => {
      state.packageDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.packages = action.payload.packages;
        state.packagesTotal = action.payload.total;
        state.packagesPage = action.payload.page;
        state.packagesLimit = action.payload.limit;
      })
      .addCase(fetchAdminPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminPackageDetail.fulfilled, (state, action) => {
        state.packageDetail = action.payload;
      })
      .addCase(createAdminPackage.fulfilled, (state, action) => {
        state.packages.unshift(action.payload);
        state.packagesTotal += 1;
        state.actionSuccess = 'Package created successfully.';
      })
      .addCase(updateAdminPackage.fulfilled, (state, action) => {
        const idx = state.packages.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.packages[idx] = action.payload;
        if (state.packageDetail?._id === action.payload._id) state.packageDetail = action.payload;
        state.actionSuccess = 'Package updated successfully.';
      })
      .addCase(toggleAdminPackageStatus.fulfilled, (state, action) => {
        const idx = state.packages.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.packages[idx] = action.payload;
        if (state.packageDetail?._id === action.payload._id) state.packageDetail = action.payload;
        state.actionSuccess = 'Package status toggled.';
      })
      .addCase(fetchAllCoins.fulfilled, (state, action) => {
        state.allCoins = action.payload;
      });
  },
});

export const { clearPackageError, clearPackageActionSuccess, resetPackageDetail } = adminPackageSlice.actions;
export default adminPackageSlice.reducer;
