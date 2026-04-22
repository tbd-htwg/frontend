import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authDevLogin, authGoogle, authMe, authRegister, type LoginResponse } from '../api/auth'
import { SESSION_STORAGE_KEY } from '../auth/sessionStorageKey'
import type { UserResponse } from '../types/api'

type AuthContextValue = {
  user: UserResponse | null
  accessToken: string | null
  /** Sign in with Google (pass GIS credential JWT). */
  loginWithGoogle: (credential: string) => Promise<void>
  /** Local Spring profile only: sign in without Google. */
  loginDev: (email: string, name?: string) => Promise<void>
  register: (email: string, name: string) => Promise<void>
  logout: () => void
  updateSessionUser: (u: UserResponse) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredSession(): LoginResponse | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { accessToken?: unknown; user?: unknown }
    if (typeof parsed.accessToken !== 'string' || !parsed.user || typeof parsed.user !== 'object') {
      return null
    }
    const u = parsed.user as UserResponse
    if (
      typeof u.id !== 'number' ||
      typeof u.email !== 'string' ||
      typeof u.name !== 'string' ||
      typeof u.imageUrl !== 'string' ||
      typeof u.description !== 'string'
    ) {
      return null
    }
    return { tokenType: 'Bearer', accessToken: parsed.accessToken, user: u }
  } catch {
    return null
  }
}

function persistSession(accessToken: string | null, user: UserResponse | null) {
  if (accessToken && user) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken, user }))
  } else {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

function applyLoginResponse(setAccessToken: (t: string) => void, setUser: (u: UserResponse) => void, r: LoginResponse) {
  setAccessToken(r.accessToken)
  setUser(r.user)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadStoredSession()
  const [accessToken, setAccessToken] = useState<string | null>(initial?.accessToken ?? null)
  const [user, setUser] = useState<UserResponse | null>(initial?.user ?? null)

  useEffect(() => {
    persistSession(accessToken, user)
  }, [accessToken, user])

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    authMe()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        if (!cancelled) {
          setAccessToken(null)
          setUser(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [accessToken])

  const loginWithGoogle = useCallback(async (credential: string) => {
    const r = await authGoogle(credential)
    applyLoginResponse(setAccessToken, setUser, r)
  }, [])

  const loginDev = useCallback(async (email: string, name?: string) => {
    const r = await authDevLogin(email, name)
    applyLoginResponse(setAccessToken, setUser, r)
  }, [])

  const register = useCallback(async (email: string, name: string) => {
    const r = await authRegister({
      email: email.trim(),
      name: name.trim(),
      imageUrl: '',
      description: '',
    })
    applyLoginResponse(setAccessToken, setUser, r)
  }, [])

  const logout = useCallback(() => {
    setAccessToken(null)
    setUser(null)
  }, [])

  const updateSessionUser = useCallback((u: UserResponse) => {
    setUser(u)
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loginWithGoogle,
      loginDev,
      register,
      logout,
      updateSessionUser,
    }),
    [user, accessToken, loginWithGoogle, loginDev, register, logout, updateSessionUser],
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
