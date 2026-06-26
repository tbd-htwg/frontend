import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchPublicTenantConfig, type PublicTenantConfig } from '../api/tenants'
import { APP_ICON_SRC, APP_INVERT_HEADER_ICON, APP_TITLE, APP_TITLE_RETRACT_TO_INITIALS } from '../branding'
import { resolveTenantSlugFromHost } from '../lib/tenantHost'
import { applyTenantTheme } from '../lib/tenantTheme'
import { isDemoMode } from '../demo/demoMode'
import type { TenantStatus } from '../types/tenant'

export type TenantBranding = {
  slug: string
  title: string
  iconUrl: string
  primaryColor: string | null
  titleRetractToInitials: boolean
  invertHeaderIcon: boolean
  identityPlatformTenantId: string | null
  enabledAuthProviders: string[]
  frontendPath: string | null
  status: TenantStatus | null
}

export type TenantBrandingOverride = Partial<
  Pick<
    TenantBranding,
    'title' | 'iconUrl' | 'primaryColor' | 'titleRetractToInitials' | 'invertHeaderIcon'
  >
>

type TenantBrandingContextValue = {
  branding: TenantBranding
  setBrandingOverride: (override: TenantBrandingOverride | null) => void
}

const defaultBranding: TenantBranding = {
  slug: 'free',
  title: APP_TITLE,
  iconUrl: APP_ICON_SRC,
  primaryColor: null,
  titleRetractToInitials: APP_TITLE_RETRACT_TO_INITIALS,
  invertHeaderIcon: APP_INVERT_HEADER_ICON,
  identityPlatformTenantId: null,
  enabledAuthProviders: ['google', 'password'],
  frontendPath: null,
  status: 'ACTIVE',
}

const TenantBrandingContext = createContext<TenantBrandingContextValue>({
  branding: defaultBranding,
  setBrandingOverride: () => {},
})

function mergeBranding(
  base: TenantBranding,
  override: TenantBrandingOverride | null,
): TenantBranding {
  if (!override) return base
  return { ...base, ...override }
}

export function TenantBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding)
  const [override, setOverride] = useState<TenantBrandingOverride | null>(null)

  const setBrandingOverride = useCallback((next: TenantBrandingOverride | null) => {
    setOverride(next)
  }, [])

  const effectiveBranding = useMemo(
    () => mergeBranding(branding, override),
    [branding, override],
  )

  useEffect(() => {
    const slug = resolveTenantSlugFromHost()
    if (slug === 'free' && !isDemoMode()) {
      setBranding(defaultBranding)
      applyTenantTheme(null)
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
          titleRetractToInitials: cfg.titleRetractToInitials ?? cfg.slug === 'free',
          invertHeaderIcon: cfg.invertHeaderIcon ?? cfg.slug === 'free',
          identityPlatformTenantId: cfg.identityPlatformTenantId,
          enabledAuthProviders: cfg.enabledAuthProviders ?? ['password'],
          frontendPath: cfg.frontendPath,
          status: cfg.status,
        }
        setBranding(next)
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

  useEffect(() => {
    applyTenantTheme(effectiveBranding.primaryColor)
  }, [effectiveBranding.primaryColor])

  const value = useMemo(
    () => ({
      branding: effectiveBranding,
      setBrandingOverride,
    }),
    [effectiveBranding, setBrandingOverride],
  )

  return (
    <TenantBrandingContext.Provider value={value}>{children}</TenantBrandingContext.Provider>
  )
}

export function useTenantBranding(): TenantBranding {
  return useContext(TenantBrandingContext).branding
}

export function useTenantBrandingOverride(): (
  override: TenantBrandingOverride | null,
) => void {
  return useContext(TenantBrandingContext).setBrandingOverride
}
