import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// npm run dev: leave VITE_API_BASE_URL empty in .env so the browser uses same-origin
// /api/v2 and /api/search; Vite proxies those paths to the GKE Gateway (no browser CORS).
const DEFAULT_DEV_API_PROXY = 'http://api.k8s.tbd-htwg.de'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_API_PROXY_TARGET || DEFAULT_DEV_API_PROXY

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/v2': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/api/search': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
