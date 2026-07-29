import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

const cache = new Map();
const CACHE_TTL = 30000;

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request cache key
const cacheKey = (config) => `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;

// Request Interceptor: Attach access token + cache hit for GET
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.method === 'get') {
      const key = cacheKey(config);
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        config.adapter = () => Promise.resolve({ data: cached.data, status: 200, statusText: 'OK', headers: {}, config });
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get' && !response.config._retry) {
      const key = cacheKey(response.config);
      cache.set(key, { data: response.data, timestamp: Date.now() });
      if (cache.size > 100) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we are already on login or refresh endpoint, do not attempt to refresh
      if (
        originalRequest.url === '/auth/login' ||
        originalRequest.url === '/auth/admin/login' ||
        originalRequest.url === '/auth/refresh-token'
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refresh = getRefreshToken();
      if (!refresh) {
        isRefreshing = false;
        clearTokens();
        window.location.href = originalRequest.url.includes('/admin') ? '/admin/login' : '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('/api/auth/refresh-token', { refreshToken: refresh });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        setTokens({ accessToken, refreshToken: newRefreshToken });

        // Update authorization header on the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Reconnect WebSockets or notify socket service if needed
        try {
          const { updateSocketToken } = await import('./socketService');
          updateSocketToken(accessToken);
        } catch (e) {
          console.warn('Socket token update failed:', e);
        }

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = originalRequest.url.includes('/admin') ? '/admin/login' : '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const clearCache = () => cache.clear();
export const invalidateCache = (urlPrefix) => {
  for (const key of cache.keys()) {
    if (key.includes(urlPrefix)) cache.delete(key);
  }
};

export default api;
