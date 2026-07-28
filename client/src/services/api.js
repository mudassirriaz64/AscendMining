import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh-token') &&
      !originalRequest.url?.includes('/auth/admin/login')
    ) {
      originalRequest._retry = true;

      if (isRefreshing && refreshPromise) {
        try {
          await refreshPromise;
          return api(originalRequest);
        } catch {
          const pathname = window.location.pathname || '';
          if (pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      }

      isRefreshing = true;
      refreshPromise = axios.post('/api/auth/refresh-token', {}, { withCredentials: true, timeout: 10000 });

      try {
        await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshPromise = null;
        const pathname = window.location.pathname || '';
        if (pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
