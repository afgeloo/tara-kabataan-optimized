import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        // Dev only (Vercel ignores server.*). Routes /api/*.php to the local PHP
        // server so frontend and API share an origin -- check_session.php only
        // sends CORS headers to the three production domains, so a cross-origin
        // setup silently fails admin login.
        // NOTE: Vite resolves vite.config.js BEFORE vite.config.ts, so this file
        // is the live config; the .ts twin is inert.
        proxy: {
            '/api': 'http://127.0.0.1:8000'
        }
    }
});
