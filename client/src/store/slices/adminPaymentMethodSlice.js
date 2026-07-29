import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../utils/api';

export const fetchAdminPaymentMethods = createAsyncThunk(
  'adminPaymentMethods/fetchAdminPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/payment-methods');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createAdminPaymentMethod = createAsyncThunk(
  'adminPaymentMethods/createAdminPaymentMethod',
  async (methodData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/payment-methods', methodData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateAdminPaymentMethod = createAsyncThunk(
  'adminPaymentMethods/updateAdminPaymentMethod',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/payment-methods/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteAdminPaymentMethod = createAsyncThunk(
  'adminPaymentMethods/deleteAdminPaymentMethod',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/payment-methods/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const toggleAdminPaymentMethodStatus = createAsyncThunk(
  'adminPaymentMethods/toggleAdminPaymentMethodStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/payment-methods/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const adminPaymentMethodSlice = createSlice({
  name: 'adminPaymentMethods',
  initialState: {
    paymentMethods: [],
    loading: false,
    error: null,
    actionSuccess: null,
  },
  reducers: {
    clearAdminPaymentMethodError: (state) => {
      state.error = null;
    },
    clearAdminPaymentMethodSuccess: (state) => {
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminPaymentMethods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminPaymentMethods.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentMethods = action.payload.data.paymentMethods;
      })
      .addCase(fetchAdminPaymentMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createAdminPaymentMethod.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(createAdminPaymentMethod.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        state.paymentMethods.unshift(action.payload.data.paymentMethod);
      })
      .addCase(createAdminPaymentMethod.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateAdminPaymentMethod.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(updateAdminPaymentMethod.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        const index = state.paymentMethods.findIndex(m => m._id === action.payload.data.paymentMethod._id);
        if (index !== -1) {
          state.paymentMethods[index] = action.payload.data.paymentMethod;
        }
      })
      .addCase(updateAdminPaymentMethod.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteAdminPaymentMethod.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(deleteAdminPaymentMethod.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        state.paymentMethods = state.paymentMethods.filter(m => m._id !== action.payload.id);
      })
      .addCase(deleteAdminPaymentMethod.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle
      .addCase(toggleAdminPaymentMethodStatus.pending, (state) => {
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(toggleAdminPaymentMethodStatus.fulfilled, (state, action) => {
        state.actionSuccess = action.payload.message;
        const index = state.paymentMethods.findIndex(m => m._id === action.payload.data.paymentMethod._id);
        if (index !== -1) {
          state.paymentMethods[index] = action.payload.data.paymentMethod;
        }
      })
      .addCase(toggleAdminPaymentMethodStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearAdminPaymentMethodError, clearAdminPaymentMethodSuccess } = adminPaymentMethodSlice.actions;
export default adminPaymentMethodSlice.reducer;
