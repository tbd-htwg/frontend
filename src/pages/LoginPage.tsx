import { useState, type FormEvent } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrochip } from '@fortawesome/free-solid-svg-icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getFirebaseAuth } from '../lib/firebaseApp'
import { firebaseAuthErrorMessage } from '../lib/firebaseAuthErrors'

type EmailMode = 'sign-in' | 'sign-up'

const DEFAULT_DEV_EMAIL = 'dev@local.test'
const DEFAULT_DEV_NAME = 'Dev User'

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginPage() {
  const { loginWithFirebaseToken, loginDev } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const [error, setError] = useState<string | null>(null)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  const [emailMode, setEmailMode] = useState<EmailMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)

  const [devCustomize, setDevCustomize] = useState(false)
  const [devEmail, setDevEmail] = useState(DEFAULT_DEV_EMAIL)
  const [devName, setDevName] = useState(DEFAULT_DEV_NAME)
  const [devSubmitting, setDevSubmitting] = useState(false)

  async function exchangeFirebaseSession() {
    const auth = getFirebaseAuth()
    const user = auth.currentUser
    if (!user) {
      throw new Error('Could not get Firebase ID token.')
    }
    const credential = await user.getIdToken()
    await loginWithFirebaseToken(credential)
    navigate(from, { replace: true })
  }

  async function handleGoogleSignIn() {
    setError(null)
    setGoogleSubmitting(true)
    try {
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      await exchangeFirebaseSession()
    } catch (err) {
      setError(firebaseAuthErrorMessage(err))
    } finally {
      setGoogleSubmitting(false)
    }
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEmailSubmitting(true)
    try {
      const auth = getFirebaseAuth()
      const trimmedEmail = email.trim()
      if (emailMode === 'sign-in') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
        const name = displayName.trim()
        if (name) {
          await updateProfile(cred.user, { displayName: name })
        }
      }
      await exchangeFirebaseSession()
    } catch (err) {
      setError(firebaseAuthErrorMessage(err))
    } finally {
      setEmailSubmitting(false)
    }
  }

  async function handleDevSignIn() {
    setError(null)
    setDevSubmitting(true)
    try {
      const signInEmail = devCustomize ? devEmail.trim() : DEFAULT_DEV_EMAIL
      const signInName = devCustomize ? devName.trim() || undefined : DEFAULT_DEV_NAME
      await loginDev(signInEmail, signInName)
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
        Sign in with email or Google through Firebase Authentication (Identity Platform). Your
        Firebase ID token is exchanged for an application session on the backend.
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
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setEmailMode('sign-in')
              setError(null)
            }}
            className={`rounded-md px-3 py-1.5 font-medium ${
              emailMode === 'sign-in'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Sign in with email
          </button>
          <button
            type="button"
            onClick={() => {
              setEmailMode('sign-up')
              setError(null)
            }}
            className={`rounded-md px-3 py-1.5 font-medium ${
              emailMode === 'sign-up'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
          {emailMode === 'sign-up' && (
            <div>
              <label htmlFor="display-name" className="block text-xs font-medium text-slate-700">
                Display name (optional)
              </label>
              <input
                id="display-name"
                type="text"
                autoComplete="name"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={emailMode === 'sign-in' ? 'current-password' : 'new-password'}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={emailSubmitting || googleSubmitting}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {emailSubmitting
              ? 'Please wait…'
              : emailMode === 'sign-in'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>
      </div>

      <div className="mt-6">
        <div className="relative flex items-center py-1">
          <div className="grow border-t border-slate-200" />
          <span className="mx-3 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
            or
          </span>
          <div className="grow border-t border-slate-200" />
        </div>
        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={googleSubmitting || emailSubmitting}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <GoogleLogo className="h-5 w-5" />
          {googleSubmitting ? 'Signing in…' : 'Sign in with Google'}
        </button>
      </div>

      {import.meta.env.DEV && (
        <div className="mt-10 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => void handleDevSignIn()}
            disabled={devSubmitting || googleSubmitting || emailSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-amber-400/80 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faMicrochip} className="h-4 w-4" aria-hidden="true" />
            {devSubmitting ? 'Signing in…' : 'Dev sign-in'}
          </button>

          {devCustomize && (
            <div className="mt-3 space-y-3">
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
            </div>
          )}

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={devCustomize}
              onChange={(e) => setDevCustomize(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />
            Customize dev user
          </label>
          <p className="mt-2 text-xs text-slate-500">
            Uses <span className="font-mono">{DEFAULT_DEV_EMAIL}</span> when not customized.
            Requires backend <code className="rounded bg-slate-100 px-1">local</code> profile.
          </p>
        </div>
      )}
    </div>
  )
}
