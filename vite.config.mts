import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:4000';
const useLiveData = process.env.VITE_USE_LIVE_DATA !== 'false';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: useLiveData
      ? {
          '/api': {
            target: apiProxyTarget,
            changeOrigin: true,
          },
        }
      : undefined,
  },
});
