import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../utils/api';

export const fetchAdminContactMessages = createAsyncThunk(
  'adminContactMessages/fetchAdminContactMessages',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/contact-messages', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  'adminContactMessages/markMessageAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/contact-messages/${id}/read`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteAdminContactMessage = createAsyncThunk(
  'adminContactMessages/deleteAdminContactMessage',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/contact-messages/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const adminContactMessageSlice = createSlice({
  name: 'adminContactMessages',
  initialState: {
    messages: [],
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
    actionSuccess: null,
  },
  reducers: {
    clearAdminContactMessageError: (state) => {
      state.error = null;
    },
    clearAdminContactMessageSuccess: (state) => {
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminContactMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminContactMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.data.messages;
        state.total = action.payload.data.pagination.total;
        state.page = action.payload.data.pagination.page;
      })
      .addCase(fetchAdminContactMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const index = state.messages.findIndex(m => m._id === action.payload.data.message._id);
        if (index !== -1) {
          state.messages[index].isRead = true;
        }
      })
      .addCase(deleteAdminContactMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = null;
      })
      .addCase(deleteAdminContactMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = action.payload.message;
        state.messages = state.messages.filter(m => m._id !== action.payload.id);
      })
      .addCase(deleteAdminContactMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminContactMessageError, clearAdminContactMessageSuccess } = adminContactMessageSlice.actions;
export default adminContactMessageSlice.reducer;
