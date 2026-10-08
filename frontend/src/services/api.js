import axios from 'axios';
import { auth } from '../firebase/config';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
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
  (response) => response.data,
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
