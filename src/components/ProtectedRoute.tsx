import { Navigate, useLocation } from 'react-router-dom'
import { useAppAuth } from '../demo/DemoAuthProvider'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAppAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
