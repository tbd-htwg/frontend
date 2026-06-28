import { isDemoMode } from '../demo/demoMode'
import { mockCustomFieldStore } from '../mocks/mockCustomFieldStore'
import type { CustomFieldDeclaration, TripCustomFieldValue } from '../types/customField'
import { requestJson } from './client'

export const ADMIN_TENANT_SLUG_HEADER = 'X-Admin-Tenant-Slug'

const ADMIN_CUSTOM_FIELDS_PATH = '/admin/custom-fields'

function adminHeaders(tenantSlug: string): HeadersInit {
  return { [ADMIN_TENANT_SLUG_HEADER]: tenantSlug }
}

export async function listAdminCustomFields(
  tenantSlug: string,
  tenantIdForDemo?: string,
): Promise<CustomFieldDeclaration[]> {
  if (isDemoMode()) {
    return mockCustomFieldStore.listDeclarations(tenantIdForDemo ?? tenantSlug)
  }
  return requestJson<CustomFieldDeclaration[]>(
    ADMIN_CUSTOM_FIELDS_PATH,
    { method: 'GET', headers: adminHeaders(tenantSlug) },
    { forceBearer: true },
  )
}

export async function createAdminCustomField(
  tenantSlug: string,
  body: { id: string; name: string; type: string },
  tenantIdForDemo?: string,
): Promise<CustomFieldDeclaration> {
  if (isDemoMode()) {
    return mockCustomFieldStore.createDeclaration(tenantIdForDemo ?? tenantSlug, body)
  }
  return requestJson<CustomFieldDeclaration>(
    ADMIN_CUSTOM_FIELDS_PATH,
    { method: 'POST', body: JSON.stringify(body), headers: adminHeaders(tenantSlug) },
    { forceBearer: true },
  )
}

export async function archiveAdminCustomField(
  tenantSlug: string,
  fieldId: string,
  archived: boolean,
  tenantIdForDemo?: string,
): Promise<CustomFieldDeclaration> {
  if (isDemoMode()) {
    return mockCustomFieldStore.setArchived(tenantIdForDemo ?? tenantSlug, fieldId, archived)
  }
  return requestJson<CustomFieldDeclaration>(
    `${ADMIN_CUSTOM_FIELDS_PATH}/${encodeURIComponent(fieldId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
      headers: adminHeaders(tenantSlug),
    },
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
