import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Same-origin /api/v2 and /api/search; Vite proxies to VITE_DEV_API_PROXY_TARGET.
// Use npm run dev:k8s (GKE Gateway) or npm run dev:minikube (localhost:8080 port-forward).
const DEFAULT_DEV_API_PROXY = 'http://localhost:8080'

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
