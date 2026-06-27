import { isDemoMode } from '../demo/demoMode'
import { mockCustomFieldStore } from '../mocks/mockCustomFieldStore'
import type { CustomFieldDeclaration, TripCustomFieldValue } from '../types/customField'
import { requestJson } from './client'

function adminPath(tenantId: string, suffix = ''): string {
  return `/admin/tenants/${encodeURIComponent(tenantId)}/custom-fields${suffix}`
}

export async function listAdminCustomFields(tenantId: string): Promise<CustomFieldDeclaration[]> {
  if (isDemoMode()) {
    return mockCustomFieldStore.listDeclarations(tenantId)
  }
  return requestJson<CustomFieldDeclaration[]>(adminPath(tenantId), { method: 'GET' }, { forceBearer: true })
}

export async function createAdminCustomField(
  tenantId: string,
  body: { id: string; name: string; type: string },
): Promise<CustomFieldDeclaration> {
  if (isDemoMode()) {
    return mockCustomFieldStore.createDeclaration(tenantId, body)
  }
  return requestJson<CustomFieldDeclaration>(
    adminPath(tenantId),
    { method: 'POST', body: JSON.stringify(body) },
    { forceBearer: true },
  )
}

export async function archiveAdminCustomField(
  tenantId: string,
  fieldId: string,
  archived: boolean,
): Promise<CustomFieldDeclaration> {
  if (isDemoMode()) {
    return mockCustomFieldStore.setArchived(tenantId, fieldId, archived)
  }
  return requestJson<CustomFieldDeclaration>(
    adminPath(tenantId, `/${encodeURIComponent(fieldId)}`),
    { method: 'PATCH', body: JSON.stringify({ archived }) },
    { forceBearer: true },
  )
}

export async function listTripCustomFields(tripId: number): Promise<TripCustomFieldValue[]> {
  if (isDemoMode()) {
    return mockCustomFieldStore.listTripValues(tripId)
  }
  // Anonymous GET: declarations are tenant-public; avoids 401/403 from stale or mismatched Bearer tokens.
  return requestJson<TripCustomFieldValue[]>(
    `/trips/${tripId}/custom-fields`,
    { method: 'GET' },
    { anonymous: true },
  )
}

export async function upsertTripCustomFields(
  tripId: number,
  values: { fieldId: string; value: string }[],
): Promise<TripCustomFieldValue[]> {
  if (isDemoMode()) {
    return mockCustomFieldStore.upsertTripValues(tripId, values)
  }
  return requestJson<TripCustomFieldValue[]>(
    `/trips/${tripId}/custom-fields`,
    { method: 'PUT', body: JSON.stringify({ values }) },
  )
}
