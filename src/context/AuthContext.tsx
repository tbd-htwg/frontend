import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authDevLogin, authFirebase, authMe, type LoginResponse } from '../api/auth'
import { ApiError, setApiAccessToken } from '../api/client'
import { SESSION_STORAGE_KEY } from '../auth/sessionStorageKey'
import { DEMO_TOKEN, DEMO_USER, isDemoMode } from '../demo/demoMode'
import type { UserResponse } from '../types/api'

type AuthContextValue = {
  user: UserResponse | null
  accessToken: string | null
  /** Exchange a Firebase ID token for an app session (Google, email/password, etc.). */
  loginWithFirebaseToken: (credential: string) => Promise<void>
  /** @deprecated Use {@link loginWithFirebaseToken}. */
  loginWithGoogle: (credential: string) => Promise<void>
  /** Local Spring profile only: sign in without Google. */
  loginDev: (email: string, name?: string) => Promise<void>
  logout: () => void
  updateSessionUser: (u: UserResponse) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseStoredUser(raw: unknown): UserResponse | null {
  if (!raw || typeof raw !== 'object') return null
  const u = raw as UserResponse
  if (
    typeof u.id !== 'number' ||
    typeof u.email !== 'string' ||
    typeof u.name !== 'string' ||
    typeof u.imageUrl !== 'string' ||
    typeof u.description !== 'string'
  ) {
    return null
  }
  return u
}

function loadStoredSession(): { accessToken: string; user: UserResponse | null } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { accessToken?: unknown; user?: unknown }
    if (typeof parsed.accessToken !== 'string') return null
    return { accessToken: parsed.accessToken, user: parseStoredUser(parsed.user) }
  } catch {
    return null
  }
}

function persistSession(accessToken: string | null, user: UserResponse | null) {
  if (!accessToken) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }
  if (user) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken, user }))
  } else {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken }))
  }
}

function applyLoginResponse(setAccessToken: (t: string) => void, setUser: (u: UserResponse) => void, r: LoginResponse) {
  setAccessToken(r.accessToken)
  setUser(r.user)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const demo = isDemoMode()
  const initial = demo ? null : loadStoredSession()
  const [accessToken, setAccessToken] = useState<string | null>(
    demo ? DEMO_TOKEN : (initial?.accessToken ?? null),
  )
  const [user, setUser] = useState<UserResponse | null>(demo ? DEMO_USER : null)

  useEffect(() => {
    setApiAccessToken(accessToken)
  }, [accessToken])

  useEffect(() => {
    if (demo) return
    persistSession(accessToken, user)
  }, [accessToken, user, demo])

  useEffect(() => {
    if (demo) return
    if (!accessToken) return
    if (user) return
    let cancelled = false
    authMe()
      .then((u) => {
        if (!cancelled) {
          setUser(u)
        }
      })
      .catch((err) => {
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          setAccessToken(null)
          setUser(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, user, demo])

  const loginWithFirebaseToken = useCallback(async (credential: string) => {
    if (demo) return
    const r = await authFirebase(credential)
    applyLoginResponse(setAccessToken, setUser, r)
  }, [demo])

  const loginWithGoogle = loginWithFirebaseToken

  const loginDev = useCallback(async (email: string, name?: string) => {
    if (demo) return
    const r = await authDevLogin(email, name)
    applyLoginResponse(setAccessToken, setUser, r)
  }, [demo])

  const logout = useCallback(() => {
    if (demo) return
    setAccessToken(null)
    setUser(null)
  }, [demo])

  const updateSessionUser = useCallback((u: UserResponse) => {
    setUser(u)
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loginWithFirebaseToken,
      loginWithGoogle,
      loginDev,
      logout,
      updateSessionUser,
    }),
    [user, accessToken, loginWithFirebaseToken, loginWithGoogle, loginDev, logout, updateSessionUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
