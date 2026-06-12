import { isDemoMode } from '../demo/demoMode'
import { resolveTenantSlugFromHost } from '../lib/tenantHost'
import { mockTenantStore } from '../mocks/mockTenantStore'
import type { TenantUser } from '../types/tenant'
import { requestJson, requestVoid } from './client'

function delay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function resolveTenantSlug(searchParams: URLSearchParams): string {
  const fromQuery = searchParams.get('tenant')?.trim().toLowerCase()
  if (fromQuery) return fromQuery
  if (isDemoMode()) return 'free'
  return resolveTenantSlugFromHost()
}

export async function listPublicTenantUsers(slug: string): Promise<TenantUser[]> {
  if (isDemoMode()) {
    await delay()
    return mockTenantStore.listPublicUsers(slug)
  }
  return requestJson<TenantUser[]>(`/tenants/${encodeURIComponent(slug)}/users`, { method: 'GET' })
}

export async function listAdminTenantUsers(tenantId: string): Promise<TenantUser[]> {
  if (isDemoMode()) {
    await delay()
    return mockTenantStore.listTenantUsers(tenantId)
  }
  return requestJson<TenantUser[]>(`/admin/tenants/${encodeURIComponent(tenantId)}/users`, { method: 'GET' }, { forceBearer: true })
}

export async function deleteAdminTenantUser(
  tenantId: string,
  userId: number,
): Promise<boolean> {
  if (isDemoMode()) {
    await delay()
    return mockTenantStore.deleteTenantUser(tenantId, userId)
  }
  await requestVoid(
    `/admin/tenants/${encodeURIComponent(tenantId)}/users/${userId}`,
    { method: 'DELETE' },
    { forceBearer: true },
  )
  return true
}
