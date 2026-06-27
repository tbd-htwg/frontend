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
import { setTenantPublicTripAccess } from '../api/client'
import {
  APP_ICON_SRC,
  APP_INVERT_HEADER_ICON,
  APP_TITLE,
  APP_TITLE_RETRACT_TO_INITIALS,
} from '../branding'
import { resolveTenantSlugFromHost } from '../lib/tenantHost'
import { applyFreeTenantShell, applyTenantTheme } from '../lib/tenantTheme'
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
  publicTripAccess: boolean
  publicImageAccess: boolean
}

export type TenantBrandingOverride = Partial<
  Pick<
    TenantBranding,
    'title' | 'iconUrl' | 'primaryColor' | 'titleRetractToInitials' | 'invertHeaderIcon'
  >
>

export type BrandingStatus = 'pending' | 'ready'

type TenantBrandingContextValue = {
  branding: TenantBranding
  brandingStatus: BrandingStatus
  brandingOverrideActive: boolean
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
  publicTripAccess: true,
  publicImageAccess: true,
}

function initialBrandingStatus(): BrandingStatus {
  const slug = resolveTenantSlugFromHost()
  return slug === 'free' && !isDemoMode() ? 'ready' : 'pending'
}

const TenantBrandingContext = createContext<TenantBrandingContextValue>({
  branding: defaultBranding,
  brandingStatus: 'pending',
  brandingOverrideActive: false,
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
  const [brandingStatus, setBrandingStatus] = useState<BrandingStatus>(initialBrandingStatus)
  const [override, setOverride] = useState<TenantBrandingOverride | null>(null)

  const setBrandingOverride = useCallback((next: TenantBrandingOverride | null) => {
    setOverride(next)
  }, [])

  const effectiveBranding = useMemo(
    () => mergeBranding(branding, override),
    [branding, override],
  )

  useEffect(() => {
    applyFreeTenantShell()
    const slug = resolveTenantSlugFromHost()
    if (slug === 'free' && !isDemoMode()) {
      setTenantPublicTripAccess(true)
      setBranding(defaultBranding)
      setBrandingStatus('ready')
      return
    }

    let cancelled = false
    fetchPublicTenantConfig(slug)
      .then((cfg: PublicTenantConfig) => {
        if (cancelled) return
        const publicTrip = cfg.publicTripAccess ?? true
        setTenantPublicTripAccess(publicTrip)
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
          publicTripAccess: publicTrip,
          publicImageAccess: cfg.publicImageAccess ?? true,
        }
        setBranding(next)
        setBrandingStatus('ready')
      })
      .catch(() => {
        if (!cancelled) {
          setTenantPublicTripAccess(true)
          setBranding({ ...defaultBranding, slug, status: null })
          setBrandingStatus('ready')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (brandingStatus !== 'ready') {
      applyFreeTenantShell()
      return
    }
    applyTenantTheme(effectiveBranding.primaryColor)
  }, [brandingStatus, effectiveBranding.primaryColor])

  const value = useMemo(
    () => ({
      branding: effectiveBranding,
      brandingStatus,
      brandingOverrideActive: override !== null,
      setBrandingOverride,
    }),
    [effectiveBranding, brandingStatus, override, setBrandingOverride],
  )

  return (
    <TenantBrandingContext.Provider value={value}>{children}</TenantBrandingContext.Provider>
  )
}

export function useTenantBranding(): TenantBranding {
  return useContext(TenantBrandingContext).branding
}

export function usePublicTripAccess(): boolean {
  return useContext(TenantBrandingContext).branding.publicTripAccess
}

export function useBrandingStatus(): BrandingStatus {
  return useContext(TenantBrandingContext).brandingStatus
}

export function useBrandingOverrideActive(): boolean {
  return useContext(TenantBrandingContext).brandingOverrideActive
}

export function useTenantBrandingOverride(): (
  override: TenantBrandingOverride | null,
) => void {
  return useContext(TenantBrandingContext).setBrandingOverride
}
