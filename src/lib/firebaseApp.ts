import { initializeApp, type FirebaseApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

let app: FirebaseApp | undefined

/**
 * Firebase Web config must belong to the same GCP/Firebase project as the trip-service
 * env {@code TRIPPLANNING_AUTH_FIREBASE_PROJECT_ID} (see Kubernetes ConfigMap).
 */
export function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app
  }
  if (getApps().length > 0) {
    app = getApps()[0]!
    return app
  }

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

  if (
    apiKey == null ||
    apiKey === '' ||
    authDomain == null ||
    authDomain === '' ||
    projectId == null ||
    projectId === ''
  ) {
    throw new Error(
      'Firebase is not configured. Copy frontend/.env.example to .env and set VITE_FIREBASE_API_KEY, ' +
        'VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID (Identity Platform / Firebase console → Project settings → Web app). ' +
        'VITE_FIREBASE_PROJECT_ID must match TRIPPLANNING_AUTH_FIREBASE_PROJECT_ID on the API.',
    )
  }

  app = initializeApp({ apiKey, authDomain, projectId })
  return app
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}
