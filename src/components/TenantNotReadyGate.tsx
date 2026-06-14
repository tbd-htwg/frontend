import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useTenantBranding } from '../context/TenantBrandingContext'

export function TenantNotReadyGate({ children }: { children: ReactNode }) {
  const branding = useTenantBranding()
  const location = useLocation()

  if (
    branding.slug === 'free' ||
    branding.status == null ||
    branding.status === 'ACTIVE' ||
    location.pathname === '/users'
  ) {
    return children
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-6 py-8 text-center">
      <h1 className="text-xl font-semibold text-amber-950">Tenant not ready</h1>
      <p className="mt-2 text-sm text-amber-900">
        This site ({branding.slug}) is currently <strong>{branding.status}</strong>. Try again
        once provisioning has finished.
      </p>
    </div>
  )
}
