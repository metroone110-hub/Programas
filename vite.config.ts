import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api/jeko': {
        target: 'https://api.jeko.africa',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jeko/, '/partner_api'),
        headers: {
          'X-API-KEY': 'jeko_76053a559816e40d1db0edcf7976413a7aed85fdcc27cc6aadc0f0de9a9a85ec',
          'X-API-KEY-ID': '32d9d6ef-d182-47bc-82ba-9c92c41510f3'
        }
      }
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    chunkSizeWarningLimit: 2500,
  },
});
