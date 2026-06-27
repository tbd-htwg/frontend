import type { CustomFieldDeclaration, CustomFieldType } from '../types/customField'
import { mockTenantStore } from './mockTenantStore'

type TripValues = Record<number, Record<string, string>>

const SEED_DECLARATIONS: CustomFieldDeclaration[] = [
  {
    id: 'justification',
    name: 'Justification',
    type: 'TEXT_LONG',
    archived: false,
    createdAt: Date.parse('2026-06-01T10:00:00Z'),
  },
  {
    id: 'total-price',
    name: 'Total price',
    type: 'NUMBER',
    archived: false,
    createdAt: Date.parse('2026-06-01T10:05:00Z'),
  },
]

class MockCustomFieldStore {
  private declarations = new Map<string, CustomFieldDeclaration[]>()
  private tripValues: TripValues = {}

  constructor() {
    const develop = mockTenantStore.getTenant('tenant-develop')
    if (develop) {
      this.declarations.set(develop.id, structuredClone(SEED_DECLARATIONS))
    }
  }

  private tenantIdOrThrow(tenantId: string): string {
    if (!mockTenantStore.getTenant(tenantId)) {
      throw new Error('Tenant not found')
    }
    return tenantId
  }

  listDeclarations(tenantId: string): CustomFieldDeclaration[] {
    this.tenantIdOrThrow(tenantId)
    return [...(this.declarations.get(tenantId) ?? [])].sort((a, b) => a.id.localeCompare(b.id))
  }

  createDeclaration(
    tenantId: string,
    body: { id: string; name: string; type: string },
  ): CustomFieldDeclaration {
    this.tenantIdOrThrow(tenantId)
    const id = body.id.trim().toLowerCase()
    const list = this.declarations.get(tenantId) ?? []
    if (list.some((f) => f.id === id)) {
      throw new Error(`Custom field id already exists: ${id}`)
    }
    const created: CustomFieldDeclaration = {
      id,
      name: body.name.trim(),
      type: body.type as CustomFieldType,
      archived: false,
      createdAt: Date.now(),
    }
    this.declarations.set(tenantId, [...list, created])
    return created
  }

  setArchived(tenantId: string, fieldId: string, archived: boolean): CustomFieldDeclaration {
    this.tenantIdOrThrow(tenantId)
    const list = this.declarations.get(tenantId) ?? []
    const idx = list.findIndex((f) => f.id === fieldId)
    if (idx < 0) throw new Error('Custom field not found')
    const updated = { ...list[idx], archived }
    list[idx] = updated
    this.declarations.set(tenantId, [...list])
    return updated
  }

  listTripValues(tripId: number): import('../types/customField').TripCustomFieldValue[] {
    const develop = mockTenantStore.getTenant('tenant-develop')
    if (!develop) return []
    const defs = (this.declarations.get(develop.id) ?? []).filter((d) => !d.archived)
    const stored = this.tripValues[tripId] ?? {}
    return defs.map((d) => ({
      fieldId: d.id,
      name: d.name,
      type: d.type,
      value: stored[d.id] ?? '',
    }))
  }

  upsertTripValues(
    tripId: number,
    values: { fieldId: string; value: string }[],
  ): import('../types/customField').TripCustomFieldValue[] {
    const current = { ...(this.tripValues[tripId] ?? {}) }
    for (const entry of values) {
      if (entry.value.trim()) {
        current[entry.fieldId] = entry.value.trim()
      } else {
        delete current[entry.fieldId]
      }
    }
    this.tripValues[tripId] = current
    return this.listTripValues(tripId)
  }
}

export const mockCustomFieldStore = new MockCustomFieldStore()
