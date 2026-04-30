import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy ExerciseDB image CDN through Vite's local server.
      // Browser requests /gif-proxy/... → Vite forwards to v2.exercisedb.io/image/...
      // This bypasses ALL hotlink/CORS restrictions since the request is same-origin.
      '/gif-proxy': {
        target: 'https://v2.exercisedb.io',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/gif-proxy/, '/image'),
      },
    },
  },
})
