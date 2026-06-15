import axios, { AxiosError } from 'axios';
import type { ApiResponse } from './types';

const LS_ACCESS_TOKEN = 'seal_access_token';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(LS_ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: clear tokens and redirect to login by dispatching a custom event
// (AuthContext listens to this event to update its state)
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(LS_ACCESS_TOKEN);
      localStorage.removeItem('seal_refresh_token');
      window.dispatchEvent(new Event('seal:unauthorized'));
    }
    // Re-throw with the backend message so callers can display it
    const message =
      error.response?.data?.message ?? error.message ?? 'Unexpected error';
    return Promise.reject(new Error(message));
  },
);

export { LS_ACCESS_TOKEN };
