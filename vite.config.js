import { defineConfig } from 'vite';

// /api/* diteruskan ke FastAPI (uvicorn app.main:app) agar tidak perlu CORS.
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});
