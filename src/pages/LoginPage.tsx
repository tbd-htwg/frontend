import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.accounts?.id) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')), {
        once: true,
      })
      return
    }
    const s = document.createElement('script')
    s.src = GIS_SCRIPT
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(s)
  })
}

export function LoginPage() {
  const { loginWithGoogle, loginDev } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [gisError, setGisError] = useState<string | null>(null)
  const [devEmail, setDevEmail] = useState('dev@local.test')
  const [devName, setDevName] = useState('Dev User')
  const [devSubmitting, setDevSubmitting] = useState(false)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setError(null)
      try {
        await loginWithGoogle(credential)
        navigate(from, { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google sign-in failed.')
      }
    },
    [from, loginWithGoogle, navigate],
  )

  useEffect(() => {
    if (!clientId || !googleButtonRef.current) return

    let cancelled = false
    ;(async () => {
      try {
        await loadGisScript()
        if (cancelled || !googleButtonRef.current) return
        const google = window.google
        if (!google?.accounts?.id) {
          setGisError('Google Identity script is unavailable.')
          return
        }
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp) => {
            if (resp.credential) void handleGoogleCredential(resp.credential)
          },
        })
        googleButtonRef.current.innerHTML = ''
        google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          width: 320,
        })
        setGisError(null)
      } catch {
        if (!cancelled) setGisError('Could not load Sign in with Google.')
      }
    })()

    return () => {
      cancelled = true
      window.google?.accounts?.id.cancel()
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = ''
      }
    }
  }, [clientId, handleGoogleCredential])

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
        Sign in with your Google account. For local development without Google, use the dev sign-in
        block below when the backend runs with the <code className="text-xs">local</code> Spring
        profile.
      </p>

      {error && (
        <div
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {!clientId ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Set <code className="text-xs">VITE_GOOGLE_CLIENT_ID</code> in{' '}
            <code className="text-xs">.env</code> to your Google OAuth Web client ID (see backend
            README). Add <code className="text-xs">http://localhost:5173</code> as an authorized
            JavaScript origin in Google Cloud Console.
          </p>
        ) : (
          <>
            {gisError && (
              <p className="text-sm text-red-700" role="alert">
                {gisError}
              </p>
            )}
            <div ref={googleButtonRef} className="flex min-h-[40px] justify-center" />
          </>
        )}
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

      <p className="mt-6 text-center text-sm text-slate-600">
        No account?{' '}
        <Link
          to="/register"
          aria-label="Go to registration page"
          className="font-medium text-slate-900 underline"
        >
          Register
        </Link>
      </p>
    </div>
  )
}
