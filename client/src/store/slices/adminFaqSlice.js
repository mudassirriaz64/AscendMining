import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../utils/api';

export const fetchAdminFAQs = createAsyncThunk(
  'adminFAQs/fetchAdminFAQs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/faqs');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createAdminFAQ = createAsyncThunk(
  'adminFAQs/createAdminFAQ',
  async (faqData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/faqs', faqData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateAdminFAQ = createAsyncThunk(
  'adminFAQs/updateAdminFAQ',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/faqs/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteAdminFAQ = createAsyncThunk(
  'adminFAQs/deleteAdminFAQ',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/faqs/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const adminFaqSlice = createSlice({
  name: 'adminFAQs',
  initialState: {
    faqs: [],
    loading: false,
    error: null,
    actionSuccess: null,
  },
  reducers: {
    clearAdminFaqError: (state) => {
      state.error = null;
    },
    clearAdminFaqSuccess: (state) => {
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminFAQs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminFAQs.fulfilled, (state, action) => {
        state.loading = false;
        state.faqs = action.payload.data.faqs;
      })
      .addCase(fetchAdminFAQs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAdminFAQ.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(createAdminFAQ.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        state.faqs.push(action.payload.data.faq);
        state.faqs.sort((a, b) => a.order - b.order);
      })
      .addCase(createAdminFAQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAdminFAQ.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(updateAdminFAQ.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        const index = state.faqs.findIndex(f => f._id === action.payload.data.faq._id);
        if (index !== -1) {
          state.faqs[index] = action.payload.data.faq;
          state.faqs.sort((a, b) => a.order - b.order);
        }
      })
      .addCase(updateAdminFAQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteAdminFAQ.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(deleteAdminFAQ.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        state.faqs = state.faqs.filter(f => f._id !== action.payload.id);
      })
      .addCase(deleteAdminFAQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminFaqError, clearAdminFaqSuccess } = adminFaqSlice.actions;
export default adminFaqSlice.reducer;
