import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { isPlatformAdminToken } from '../lib/jwtClaims'
import { isDemoMode } from './demoMode'

/** Always mounts AuthProvider (demo user is injected inside AuthContext when VITE_DEMO_MODE=true). */
export function AppAuthProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

export function useAppAuth() {
  return useAuth()
}

export function useIsPlatformAdmin(): boolean {
  const { accessToken } = useAuth()
  if (isDemoMode()) return true
  return isPlatformAdminToken(accessToken)
}
