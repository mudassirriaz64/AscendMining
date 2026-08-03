import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Submit a new wallet address change request.
 * Replaces the old direct updateWalletAddress action.
 */
export const submitWalletChangeRequest = createAsyncThunk(
  'walletChange/submit',
  async ({ coinSymbol, requestedWalletAddress }, { rejectWithValue }) => {
    try {
      const response = await api.post('/wallets/request-change', {
        coinSymbol,
        requestedWalletAddress,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: { message: 'Failed to submit request.' } });
    }
  }
);

/**
 * Fetch the authenticated user's wallet change request history.
 */
export const fetchMyWalletChangeRequests = createAsyncThunk(
  'walletChange/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/wallets/change-requests');
      return response.data.data.requests;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: { message: 'Failed to fetch requests.' } });
    }
  }
);

const walletChangeSlice = createSlice({
  name: 'walletChange',
  initialState: {
    requests: [],
    loading: false,
    submitting: false,
    error: null,
    submitSuccess: null,
  },
  reducers: {
    clearWalletChangeError: (state) => {
      state.error = null;
    },
    clearWalletChangeSuccess: (state) => {
      state.submitSuccess = null;
    },
    /**
     * Called when a real-time socket event arrives for a wallet change status update.
     * Updates the matching request in local state so the UI reflects approval/rejection
     * without requiring a full page reload.
     */
    updateWalletChangeStatus: (state, action) => {
      const { _id, status, rejectionReason } = action.payload;
      const idx = state.requests.findIndex((r) => r._id === _id);
      if (idx !== -1) {
        state.requests[idx] = { ...state.requests[idx], status, rejectionReason: rejectionReason || null };
      }
    },
    /**
     * Prepend a freshly submitted request to the list so the UI updates
     * immediately before a full refetch.
     */
    addWalletChangeRequest: (state, action) => {
      const req = action.payload;
      if (req && req._id && !state.requests.some((r) => r._id === req._id)) {
        state.requests = [req, ...state.requests];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit
      .addCase(submitWalletChangeRequest.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.submitSuccess = null;
      })
      .addCase(submitWalletChangeRequest.fulfilled, (state, action) => {
        state.submitting = false;
        state.submitSuccess = action.payload.request?.coinSymbol
          ? `Your ${action.payload.request.coinSymbol} wallet address change has been submitted for review.`
          : 'Wallet address change request submitted.';
        // Optimistically prepend the new request
        const req = action.payload.request;
        if (req && req._id && !state.requests.some((r) => r._id === req._id)) {
          state.requests = [req, ...state.requests];
        }
      })
      .addCase(submitWalletChangeRequest.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      // Fetch
      .addCase(fetchMyWalletChangeRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyWalletChangeRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchMyWalletChangeRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearWalletChangeError,
  clearWalletChangeSuccess,
  updateWalletChangeStatus,
  addWalletChangeRequest,
} = walletChangeSlice.actions;

export default walletChangeSlice.reducer;
