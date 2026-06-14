import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchPublicTenantConfig, type PublicTenantConfig } from '../api/tenants'
import { APP_ICON_SRC, APP_TITLE } from '../branding'
import { resolveTenantSlugFromHost } from '../lib/tenantHost'
import { isDemoMode } from '../demo/demoMode'

import type { TenantStatus } from '../types/tenant'

export type TenantBranding = {
  slug: string
  title: string
  iconUrl: string
  primaryColor: string | null
  identityPlatformTenantId: string | null
  enabledAuthProviders: string[]
  frontendPath: string | null
  status: TenantStatus | null
}

const defaultBranding: TenantBranding = {
  slug: 'free',
  title: APP_TITLE,
  iconUrl: APP_ICON_SRC,
  primaryColor: null,
  identityPlatformTenantId: null,
  enabledAuthProviders: ['google', 'password'],
  frontendPath: null,
  status: 'ACTIVE',
}

const TenantBrandingContext = createContext<TenantBranding>(defaultBranding)

export function TenantBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding)

  useEffect(() => {
    const slug = resolveTenantSlugFromHost()
    if (slug === 'free' && !isDemoMode()) {
      setBranding(defaultBranding)
      document.documentElement.style.removeProperty('--tenant-primary')
      return
    }

    let cancelled = false
    fetchPublicTenantConfig(slug)
      .then((cfg: PublicTenantConfig) => {
        if (cancelled) return
        const next: TenantBranding = {
          slug: cfg.slug,
          title: cfg.headerTitle ?? cfg.slug,
          iconUrl: cfg.iconUrl ?? APP_ICON_SRC,
          primaryColor: cfg.primaryColor,
          identityPlatformTenantId: cfg.identityPlatformTenantId,
          enabledAuthProviders: cfg.enabledAuthProviders ?? ['google', 'password'],
          frontendPath: cfg.frontendPath,
          status: cfg.status,
        }
        setBranding(next)
        if (cfg.primaryColor) {
          document.documentElement.style.setProperty('--tenant-primary', cfg.primaryColor)
        } else {
          document.documentElement.style.removeProperty('--tenant-primary')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBranding({ ...defaultBranding, slug, status: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => branding, [branding])
  return (
    <TenantBrandingContext.Provider value={value}>{children}</TenantBrandingContext.Provider>
  )
}

export function useTenantBranding(): TenantBranding {
  return useContext(TenantBrandingContext)
}
