import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // host: true,
    proxy: {
      '/auth': 'http://0.0.0.0:3001',
      '/game': 'http://0.0.0.0:3001',
      '/stats': 'http://0.0.0.0:3001',
      '/health': 'http://0.0.0.0:3001',
    },
  },
})
