import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
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