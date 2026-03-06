import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Inject access token on every request
client.interceptors.request.use((config) => {
  // Imported lazily to avoid circular dependency with authStore
  const raw = localStorage.getItem('auth-store');
  if (raw) {
    try {
      const state = JSON.parse(raw);
      if (state?.state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.state.accessToken}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

// On 401: attempt token refresh, retry original request once
let isRefreshing = false;

// queue item for handling awaiting requests during a token refresh
interface QueueItem {
  resolve: (token: string | null) => void;
  reject: (err: any) => void;
}

let failedQueue: QueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token),
  );
  failedQueue = [];
};

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const errorCode = error.response?.data?.error?.code;
    // TOKEN_MISSING means no token — don't try to refresh
    if (errorCode === 'TOKEN_MISSING') return Promise.reject(error);

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        })
        .catch(Promise.reject);
    }

    isRefreshing = true;

    try {
      const raw = localStorage.getItem('auth-store');
      const state = raw ? JSON.parse(raw)?.state : null;
      const refreshToken = state?.refreshToken;

      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refresh_token: refreshToken,
      });
      const newToken = data.data.access_token;

      // Update store
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.getState().setAccessToken(newToken);

      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return client(original);
    } catch (err) {
      processQueue(err, null);
      // Clear auth and redirect
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default client;
