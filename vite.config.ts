import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyTarget =
  ((globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env?.
    VITE_API_PROXY_TARGET ?? 'http://localhost:8081');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
