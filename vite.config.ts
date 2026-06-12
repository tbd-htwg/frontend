import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Same-origin /api/v2 and /api/search; Vite proxies to VITE_DEV_API_PROXY_TARGET.
// Use npm run dev:k8s (GKE Gateway) or npm run dev:minikube (localhost:8080 port-forward).
const DEFAULT_DEV_API_PROXY = 'http://localhost:8080'
const DEFAULT_PLATFORM_PROXY = 'http://localhost:8083'

/** Preserve browser Host for platform tenant resolution (forwards X-Forwarded-Host). */
function platformServiceProxy(target: string) {
  return {
    target,
    changeOrigin: true,
    configure: (proxy: { on: (event: 'proxyReq', listener: (proxyReq: { setHeader: (name: string, value: string) => void }, req: { headers: { host?: string } }) => void) => void }) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        const host = req.headers.host
        if (typeof host === 'string') {
          proxyReq.setHeader('X-Forwarded-Host', host)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_API_PROXY_TARGET || DEFAULT_DEV_API_PROXY
  const platformProxyTarget = env.VITE_DEV_PLATFORM_PROXY_TARGET || DEFAULT_PLATFORM_PROXY

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/v2/admin': platformServiceProxy(platformProxyTarget),
        '/api/v2/auth': platformServiceProxy(platformProxyTarget),
        '/api/v2/tenants': platformServiceProxy(platformProxyTarget),
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
