import { isDemoMode } from '../demo/demoMode'
import { mockTenantStore } from '../mocks/mockTenantStore'
import type { TenantUser } from '../types/tenant'

function delay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function resolveTenantSlug(searchParams: URLSearchParams): string {
  const fromQuery = searchParams.get('tenant')?.trim().toLowerCase()
  if (fromQuery) return fromQuery
  if (isDemoMode()) return 'free'
  return 'free'
}

export async function listPublicTenantUsers(slug: string): Promise<TenantUser[]> {
  if (isDemoMode()) {
    await delay()
    return mockTenantStore.listPublicUsers(slug)
  }
  throw new Error('Tenant users API not implemented — enable demo mode or wire backend')
}

export async function listAdminTenantUsers(tenantId: string): Promise<TenantUser[]> {
  if (isDemoMode()) {
    await delay()
    return mockTenantStore.listTenantUsers(tenantId)
  }
  const { requestJson } = await import('./client')
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
  throw new Error('Tenant users API not implemented — enable demo mode or wire backend')
}
