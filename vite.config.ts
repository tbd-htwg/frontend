import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

// Browser always uses same-origin /api/v2 and /api/search; Vite proxies to backend services.
// Route order mirrors backend/k8s/local/chart/values-local.yaml ingressRoutes (first match wins).
const DEFAULT_TRIP_PROXY = 'http://localhost:8080'
const DEFAULT_PLATFORM_PROXY = 'http://localhost:8083'

function simpleProxy(target: string): ProxyOptions {
  return { target, changeOrigin: true }
}

/** Preserve browser Host for platform tenant resolution (forwards X-Forwarded-Host). */
function platformServiceProxy(target: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    configure: (proxy: {
      on: (
        event: 'proxyReq',
        listener: (
          proxyReq: { setHeader: (name: string, value: string) => void },
          req: { headers: { host?: string } },
        ) => void,
      ) => void
    }) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        const host = req.headers.host
        if (typeof host === 'string') {
          proxyReq.setHeader('X-Forwarded-Host', host)
        }
      })
    },
  }
}

/**
 * Dev proxy map aligned with production ingress paths.
 * @param trip trip-service (also used as fallback when social/external share one ingress URL)
 */
function buildApiProxy(targets: {
  trip: string
  social: string
  external: string
  platform: string
}): Record<string, ProxyOptions> {
  const { trip, social, external, platform } = targets
  return {
    // platform-service (M3): auth issuance + tenant admin
    '/api/v2/admin': platformServiceProxy(platform),
    '/api/v2/auth': platformServiceProxy(platform),
    '/api/v2/tenants': platformServiceProxy(platform),

    // social-service
    '/api/v2/comments': simpleProxy(social),
    '/api/v2/trips/search/countLikes': simpleProxy(social),
    '^/api/v2/trips/[^/]+/liked-by-current-user': simpleProxy(social),
    '^/api/v2/trips/[^/]+/comments': simpleProxy(social),
    '^/api/v2/trips/[^/]+/community': simpleProxy(social),
    '^/api/v2/trips/[^/]+/like': simpleProxy(social),
    '^/api/v2/users/[^/]+/likedTrips': simpleProxy(social),

    // external-info-service
    '/api/v2/external': simpleProxy(external),

    // trip-service (catch-alls last)
    '/api/search': simpleProxy(trip),
    '/api/v2': simpleProxy(trip),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const tripTarget = env.VITE_DEV_API_PROXY_TARGET || DEFAULT_TRIP_PROXY
  // minikube/k8s: omit social/external targets → same ingress/gateway as trip
  const socialTarget = env.VITE_DEV_SOCIAL_PROXY_TARGET || tripTarget
  const externalTarget = env.VITE_DEV_EXTERNAL_PROXY_TARGET || tripTarget
  const platformTarget = env.VITE_DEV_PLATFORM_PROXY_TARGET || DEFAULT_PLATFORM_PROXY

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: buildApiProxy({
        trip: tripTarget,
        social: socialTarget,
        external: externalTarget,
        platform: platformTarget,
      }),
    },
  }
})
