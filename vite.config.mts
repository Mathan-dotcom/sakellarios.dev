import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:4010';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        bypass(req, res) {
          if (req.method && req.method.toUpperCase() !== 'GET') {
            if (res) {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Allow', 'GET');
              res.end(
                JSON.stringify({
                  success: false,
                  error: `Method ${req.method} Not Allowed. Proxy rejects non-GET requests.`,
                })
              );
            }
            return false;
          }
        },
      },
    },
  },
});
