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
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
