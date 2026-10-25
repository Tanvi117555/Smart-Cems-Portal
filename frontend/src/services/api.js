import axios from 'axios';
import { auth } from '../firebase/config';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Fresh Firebase ID Token to outgoing requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Allow browser to generate multipart/form-data boundary for FormData payloads
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      } else {
        const cachedToken = localStorage.getItem('cems_token');
        if (cachedToken) {
          config.headers.Authorization = `Bearer ${cachedToken}`;
        }
      }
    } catch (e) {
      console.warn('Could not attach token:', e.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor
api.interceptors.response.use(
  (response) => {
    // Detect if Vercel rewritten an API call into the SPA's HTML document (index.html)
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE html')) {
      const url = response.config?.url || 'API';
      return Promise.reject(new Error(`Backend service unavailable for ${url} (SPA rewrite detected)`));
    }

    const data = response.data;

    // Attach non-enumerable 'data' reference to self if data is a plain JSON object,
    // so legacy components calling res.data.success and modern components calling res.success both work!
    if (data && typeof data === 'object' && !(data instanceof Blob) && !Array.isArray(data) && data.data === undefined) {
      try {
        Object.defineProperty(data, 'data', {
          value: data,
          writable: true,
          enumerable: false,
          configurable: true
        });
      } catch (e) {
        // Ignore object sealing issues
      }
    }

    return data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/faculty') || currentPath.startsWith('/student')) {
        localStorage.removeItem('cems_token');
        localStorage.removeItem('cems_user');
      }
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
