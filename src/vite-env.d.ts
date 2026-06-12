/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** Firebase Web API key (public; from Firebase console → Project settings → Web app). */
  readonly VITE_FIREBASE_API_KEY?: string
  /** e.g. your-project-id.firebaseapp.com */
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  /** Must match trip-service TRIPPLANNING_AUTH_FIREBASE_PROJECT_ID. */
  readonly VITE_FIREBASE_PROJECT_ID?: string
  /** Maps JavaScript API key (HTTP referrer–restricted; separate from server Routes/Places key). */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  /** When true, tenant admin UI uses in-memory mock data (npm run dev:demo). */
  readonly VITE_DEMO_MODE?: string
  /** Standard-tier host suffix for subdomain tenant resolution (e.g. k8s.tbd-htwg.de). */
  readonly VITE_PLATFORM_HOST_BASE?: string
  /** Enterprise-tier host suffix (e.g. enterprise.tbd-htwg.de). */
  readonly VITE_PLATFORM_ENTERPRISE_HOST_BASE?: string
  /** Vite dev-server proxy target for platform-service API (local multitenancy). */
  readonly VITE_DEV_PLATFORM_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
