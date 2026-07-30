import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { getAccessToken, setTokens, clearTokens } from '../../services/tokenStorage';

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      const data = response.data.data;
      if (data.accessToken && data.refreshToken) {
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Registration failed.' });
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ emailOrUsername, password, keepLoggedIn }, { rejectWithValue }) => {
    try {
      const response = await authService.login({ emailOrUsername, password });
      const data = response.data.data;
      if (data.accessToken && data.refreshToken) {
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, keepLoggedIn });
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Login failed.' });
    }
  }
);

export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.adminLogin(credentials);
      const data = response.data.data;
      if (data.accessToken && data.refreshToken) {
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Admin login failed.' });
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    const token = getAccessToken();
    if (!token) {
      return { user: null };
    }
    try {
      const response = await authService.getMe();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Session expired.' });
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update profile.' });
    }
  }
);

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.updatePassword(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update password.' });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      clearTokens();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Logout failed.' });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    hydrated: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.admin;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.hydrated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.hydrated = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
