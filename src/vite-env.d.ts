/// <reference types="vite/client" />
/// <reference path="./google-gsi.d.ts" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** OAuth 2.0 Web client ID for Sign in with Google (GIS). */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
