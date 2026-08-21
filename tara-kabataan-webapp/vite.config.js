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
        // Mirror the production rewrite: /api/<script>.php is dispatched through
        // the single router function (see vercel.json), not served as a file.
        // Keeping dev identical to prod means the router is actually exercised.
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                rewrite: (p) => {
                    const [path, qs] = p.split('?');
                    const endpoint = path.replace(/^\/api\//, '');
                    return '/api/index.php?__endpoint=' + encodeURIComponent(endpoint)
                        + (qs ? '&' + qs : '');
                }
            }
        }
    }
});
