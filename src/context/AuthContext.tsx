import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { listUsers, registerUser } from '../api/users'
import type { UserResponse } from '../types/api'

const STORAGE_KEY = 'tripPlannerUser'

type AuthContextValue = {
  user: UserResponse | null
  login: (name: string) => Promise<void>
  register: (email: string, name: string) => Promise<void>
  logout: () => void
  updateSessionUser: (u: UserResponse) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): UserResponse | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UserResponse
    if (
      typeof parsed?.id === 'number' &&
      typeof parsed?.email === 'string' &&
      typeof parsed?.name === 'string' &&
      typeof parsed?.imageUrl === 'string' &&
      typeof parsed?.description === 'string'
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function persistUser(user: UserResponse | null) {
  if (user) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(() => loadStoredUser())

  useEffect(() => {
    persistUser(user)
  }, [user])

  const login = useCallback(async (name: string) => {
    const trimmed = name.trim()
    const users = await listUsers()
    const found = users.find((u) => u.name === trimmed)
    if (!found) {
      throw new Error('No user found with that name.')
    }
    setUser(found)
  }, [])

  const register = useCallback(async (email: string, name: string) => {
    const created = await registerUser({
      email: email.trim(),
      name: name.trim(),
      description: '',
      imageUrl: '',
    })
    setUser(created)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const updateSessionUser = useCallback((u: UserResponse) => {
    setUser(u)
  }, [])

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      updateSessionUser,
    }),
    [user, login, register, logout, updateSessionUser],
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
