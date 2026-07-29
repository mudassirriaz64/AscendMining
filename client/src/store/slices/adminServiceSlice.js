import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAdminServices = createAsyncThunk(
  'adminServices/fetchAdminServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/services');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createAdminService = createAsyncThunk(
  'adminServices/createAdminService',
  async (serviceData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/services', serviceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateAdminService = createAsyncThunk(
  'adminServices/updateAdminService',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/services/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteAdminService = createAsyncThunk(
  'adminServices/deleteAdminService',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/services/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const adminServiceSlice = createSlice({
  name: 'adminServices',
  initialState: {
    services: [],
    loading: false,
    error: null,
    actionSuccess: null,
  },
  reducers: {
    clearAdminServiceError: (state) => {
      state.error = null;
    },
    clearAdminServiceSuccess: (state) => {
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload.data.services;
      })
      .addCase(fetchAdminServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAdminService.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(createAdminService.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        state.services.push(action.payload.data.service);
        state.services.sort((a, b) => a.order - b.order);
      })
      .addCase(createAdminService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAdminService.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(updateAdminService.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        const index = state.services.findIndex(s => s._id === action.payload.data.service._id);
        if (index !== -1) {
          state.services[index] = action.payload.data.service;
          state.services.sort((a, b) => a.order - b.order);
        }
      })
      .addCase(updateAdminService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteAdminService.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(deleteAdminService.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        state.services = state.services.filter(s => s._id !== action.payload.id);
      })
      .addCase(deleteAdminService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminServiceError, clearAdminServiceSuccess } = adminServiceSlice.actions;
export default adminServiceSlice.reducer;
