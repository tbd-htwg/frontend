import { useState, type FormEvent } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getFirebaseAuth } from '../lib/firebaseApp'

export function LoginPage() {
  const { loginWithGoogle, loginDev } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const [error, setError] = useState<string | null>(null)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const [devEmail, setDevEmail] = useState('dev@local.test')
  const [devName, setDevName] = useState('Dev User')
  const [devSubmitting, setDevSubmitting] = useState(false)

  async function handleGoogleSignIn() {
    setError(null)
    setGoogleSubmitting(true)
    try {
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const credential = await result.user.getIdToken()
      if (!credential) {
        throw new Error('Could not get Firebase ID token.')
      }
      await loginWithGoogle(credential)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.')
    } finally {
      setGoogleSubmitting(false)
    }
  }

  async function handleDevSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setDevSubmitting(true)
    try {
      await loginDev(devEmail.trim(), devName.trim() || undefined)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dev sign-in failed.')
    } finally {
      setDevSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-slate-900">Log in</h1>
      <p className="mt-1 text-sm text-slate-600">
        Sign in with your Google account through Firebase Authentication. For local development
        without Google, use the dev sign-in block below when the backend runs with the{' '}
        <code className="text-xs">local</code> Spring profile.
      </p>

      {error && (
        <div
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={googleSubmitting}
          className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          {googleSubmitting ? 'Signing in…' : 'Sign in with Google'}
        </button>
      </div>

      {import.meta.env.DEV && (
        <div className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-sm font-semibold text-slate-800">Dev sign-in (no Google)</h2>
          <p className="mt-1 text-xs text-slate-600">
            Requires backend <code className="rounded bg-slate-100 px-1">SPRING_PROFILES_ACTIVE=local</code>{' '}
            and <code className="rounded bg-slate-100 px-1">POST /api/v2/auth/dev-login</code>.
          </p>
          <form onSubmit={handleDevSubmit} className="mt-3 space-y-3">
            <div>
              <label htmlFor="dev-email" className="block text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                id="dev-email"
                type="email"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dev-name" className="block text-xs font-medium text-slate-700">
                Display name (optional)
              </label>
              <input
                id="dev-name"
                type="text"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={devSubmitting}
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              {devSubmitting ? 'Signing in…' : 'Dev sign-in'}
            </button>
          </form>
        </div>
      )}

    </div>
  )
}
