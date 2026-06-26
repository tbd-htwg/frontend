import { isDemoMode } from '../demo/demoMode'
import { mockTenantStore } from '../mocks/mockTenantStore'
import type {
  PublicTenantConfig,
  Tenant,
  TenantBrandingUpdateRequest,
  TenantCreateRequest,
  TenantListFilters,
} from '../types/tenant'
import type { SignedImageUploadRequest, SignedImageUploadResponse } from '../types/api'
import { requestJson, requestVoid, uploadFileToSignedUrl } from './client'

export type { PublicTenantConfig }

export type TenantSlugAvailability = {
  available: boolean
  reason: string | null
}

function adminPath(path: string): string {
  return `/admin/tenants${path}`
}

export async function fetchPublicTenantConfig(slug: string): Promise<PublicTenantConfig> {
  if (isDemoMode()) {
    const tenant = mockTenantStore.getTenantBySlug(slug)
    if (!tenant) throw new Error('Tenant not found')
    return {
      slug: tenant.slug,
      tier: tenant.tier,
      status: tenant.status,
      hostUrl: tenant.hostUrl,
      identityPlatformTenantId: null,
      enabledAuthProviders: ['google', 'password'],
      primaryColor: tenant.primaryColor ?? null,
      headerTitle: tenant.headerTitle ?? tenant.displayName,
      iconUrl: tenant.iconUrl ?? null,
      titleRetractToInitials: tenant.titleRetractToInitials ?? tenant.slug === 'free',
      invertHeaderIcon: tenant.invertHeaderIcon ?? tenant.slug === 'free',
      frontendPath: tenant.frontendPath ?? null,
    }
  }
  return requestJson<PublicTenantConfig>(`/tenants/${encodeURIComponent(slug)}/public-config`)
}

export async function listTenants(filters: TenantListFilters = {}): Promise<Tenant[]> {
  if (isDemoMode()) {
    return mockTenantStore.listTenants(filters)
  }
  const params = new URLSearchParams()
  if (filters.includeArchived) params.set('includeArchived', 'true')
  if (filters.tier) params.set('tier', filters.tier)
  if (filters.status) params.set('status', filters.status)
  const q = params.toString()
  return requestJson<Tenant[]>(adminPath(q ? `?${q}` : ''), { method: 'GET' }, { forceBearer: true })
}

export async function checkTenantSlugAvailability(
  slug: string,
): Promise<TenantSlugAvailability> {
  const normalized = slug.trim().toLowerCase()
  if (isDemoMode()) {
    return mockTenantStore.checkSlugAvailability(normalized)
  }
  const params = new URLSearchParams({ slug: normalized })
  return requestJson<TenantSlugAvailability>(
    adminPath(`/slug-availability?${params}`),
    { method: 'GET' },
    { forceBearer: true },
  )
}

export async function getTenant(id: string): Promise<Tenant | null> {
  if (isDemoMode()) {
    return mockTenantStore.getTenant(id)
  }
  try {
    return await requestJson<Tenant>(adminPath(`/${encodeURIComponent(id)}`), { method: 'GET' }, { forceBearer: true })
  } catch {
    return null
  }
}

export async function createTenant(req: TenantCreateRequest): Promise<Tenant> {
  if (isDemoMode()) {
    return mockTenantStore.createTenant(req)
  }
  return requestJson<Tenant>(
    adminPath(''),
    { method: 'POST', body: JSON.stringify(req) },
    { forceBearer: true },
  )
}

export type PlatformInfo = {
  stubProvisioning: boolean
  message: string
}

export async function fetchPlatformInfo(): Promise<PlatformInfo | null> {
  if (isDemoMode()) {
    return { stubProvisioning: true, message: 'Demo mode — frontend mocks only' }
  }
  try {
    return await requestJson<PlatformInfo>('/admin/platform-info', { method: 'GET' }, { forceBearer: true })
  } catch {
    return null
  }
}

export async function updateTenantBranding(
  id: string,
  body: TenantBrandingUpdateRequest,
): Promise<Tenant> {
  if (isDemoMode()) {
    return mockTenantStore.updateBranding(id, body)
  }
  return requestJson<Tenant>(
    adminPath(`/${encodeURIComponent(id)}/branding`),
    { method: 'PUT', body: JSON.stringify(body) },
    { forceBearer: true },
  )
}

export async function uploadTenantBrandingIcon(tenantId: string, file: File): Promise<string> {
  const contentType = file.type?.trim()
  if (!contentType.startsWith('image/')) {
    throw new Error('Only image files are allowed.')
  }
  if (isDemoMode()) {
    return mockTenantStore.uploadBrandingIcon(tenantId, file)
  }
  const signed = await requestJson<SignedImageUploadResponse>(
    adminPath(`/${encodeURIComponent(tenantId)}/branding/icon`),
    {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        contentType,
      } satisfies SignedImageUploadRequest),
    },
    { forceBearer: true },
  )
  const stubReadUrl = await uploadFileToSignedUrl(signed.uploadUrl, file, signed.contentType)
  return stubReadUrl || signed.signedReadUrl
}

export async function archiveTenant(id: string): Promise<Tenant | null> {
  if (isDemoMode()) {
    return mockTenantStore.archiveTenant(id)
  }
  return requestJson<Tenant>(
    adminPath(`/${encodeURIComponent(id)}/archive`),
    { method: 'POST' },
    { forceBearer: true },
  )
}

export async function retryTenant(id: string): Promise<void> {
  if (isDemoMode()) {
    mockTenantStore.retryTenant(id)
    return
  }
  await requestVoid(adminPath(`/${encodeURIComponent(id)}/retry`), { method: 'POST' }, { forceBearer: true })
}
