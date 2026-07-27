import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminCoinService from '../../services/adminCoinService';

export const fetchCoins = createAsyncThunk(
  'adminCoins/fetchCoins',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminCoinService.list(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch coins.' });
    }
  }
);

export const fetchCoinDetail = createAsyncThunk(
  'adminCoins/fetchCoinDetail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminCoinService.get(id);
      return response.data.data.coin;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch coin.' });
    }
  }
);

export const createCoin = createAsyncThunk(
  'adminCoins/createCoin',
  async (data, { rejectWithValue }) => {
    try {
      const response = await adminCoinService.create(data);
      return response.data.data.coin;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create coin.' });
    }
  }
);

export const updateCoin = createAsyncThunk(
  'adminCoins/updateCoin',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await adminCoinService.update(id, data);
      return response.data.data.coin;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update coin.' });
    }
  }
);

export const toggleCoinStatus = createAsyncThunk(
  'adminCoins/toggleCoinStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminCoinService.toggleStatus(id);
      return response.data.data.coin;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to toggle coin status.' });
    }
  }
);

export const deleteCoin = createAsyncThunk(
  'adminCoins/deleteCoin',
  async (id, { rejectWithValue }) => {
    try {
      await adminCoinService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete coin.' });
    }
  }
);

const adminCoinSlice = createSlice({
  name: 'adminCoins',
  initialState: {
    coins: [],
    coinsTotal: 0,
    coinsPage: 1,
    coinsLimit: 20,
    coinDetail: null,
    loading: false,
    error: null,
    actionSuccess: null,
  },
  reducers: {
    clearCoinError: (state) => {
      state.error = null;
    },
    clearCoinActionSuccess: (state) => {
      state.actionSuccess = null;
    },
    resetCoinDetail: (state) => {
      state.coinDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoins.fulfilled, (state, action) => {
        state.loading = false;
        state.coins = action.payload.coins;
        state.coinsTotal = action.payload.total;
        state.coinsPage = action.payload.page;
        state.coinsLimit = action.payload.limit;
      })
      .addCase(fetchCoins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCoinDetail.fulfilled, (state, action) => {
        state.coinDetail = action.payload;
      })
      .addCase(createCoin.fulfilled, (state, action) => {
        state.coins.unshift(action.payload);
        state.coinsTotal += 1;
        state.actionSuccess = 'Coin created successfully.';
      })
      .addCase(updateCoin.fulfilled, (state, action) => {
        const idx = state.coins.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.coins[idx] = action.payload;
        if (state.coinDetail?._id === action.payload._id) state.coinDetail = action.payload;
        state.actionSuccess = 'Coin updated successfully.';
      })
      .addCase(toggleCoinStatus.fulfilled, (state, action) => {
        const idx = state.coins.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.coins[idx] = action.payload;
        if (state.coinDetail?._id === action.payload._id) state.coinDetail = action.payload;
        state.actionSuccess = 'Coin status toggled.';
      })
      .addCase(deleteCoin.fulfilled, (state, action) => {
        state.coins = state.coins.filter((c) => c._id !== action.payload);
        state.coinsTotal -= 1;
        state.actionSuccess = 'Coin deleted successfully.';
      })
      .addCase(deleteCoin.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearCoinError, clearCoinActionSuccess, resetCoinDetail } = adminCoinSlice.actions;
export default adminCoinSlice.reducer;
