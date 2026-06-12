import { Navigate, useLocation } from 'react-router-dom'
import { useIsPlatformAdmin } from '../demo/DemoAuthProvider'
import { useAppAuth } from '../demo/DemoAuthProvider'
import { isDemoMode } from '../demo/demoMode'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAppAuth()
  const isAdmin = useIsPlatformAdmin()
  const location = useLocation()

  if (isDemoMode()) {
    return children
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
