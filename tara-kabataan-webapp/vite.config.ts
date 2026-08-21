import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Dev only (Vercel ignores server.*). Routes /api/*.php to the local PHP
    // server so the frontend and API share an origin -- check_session.php only
    // sends CORS headers to the three production domains, so a cross-origin
    // setup silently fails admin login.
    proxy: {
      '/api': 'http://127.0.0.1:8000'
    }
  },
  build: {
    // This tells Vite to completely ignore your backend files during the build process
    rollupOptions: {
      external: [
        /^\/api\/.*/,
        /^\/vendor\/.*/,
        /\.php$/
      ]
    }
  }
})