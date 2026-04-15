import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/users': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/trips': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/comments': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/locations': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/transports': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/accommodations': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/trip-locations': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/profile': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
