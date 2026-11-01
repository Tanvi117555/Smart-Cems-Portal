import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Smart-Cems-Portal/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/events': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/departments': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/categories': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/meta': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/registrations': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/payments': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/attendance': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/feedback': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/certificates': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/gallery': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/notifications': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/reports': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/users': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
