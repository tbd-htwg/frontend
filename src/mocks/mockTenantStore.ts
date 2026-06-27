import {
  dbNameForTier,
  estimatedCostForTier,
  frontendPathForTier,
  hostUrlForSlug,
  namespaceForTier,
  enterpriseSteps,
  SEED_TENANTS,
  standardSteps,
} from './tenantFixtures'
import type {
  Tenant,
  TenantCreateRequest,
  TenantListFilters,
  TenantTier,
  TenantUser,
} from '../types/tenant'

type Listener = () => void

function clone<T>(value: T): T {
  return structuredClone(value)
}

function nowIso(): string {
  return new Date().toISOString()
}

function stepsForTier(tier: TenantTier) {
  return tier === 'ENTERPRISE' || tier === 'DEVELOP' ? enterpriseSteps(0) : standardSteps(0)
}

function stepCount(tier: TenantTier): number {
  return tier === 'ENTERPRISE' || tier === 'DEVELOP' ? 7 : 5
}

function isEnterpriseLike(tier: TenantTier): boolean {
  return tier === 'ENTERPRISE' || tier === 'DEVELOP'
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RESERVED_SLUGS = new Set([
  'free',
  'develop',
  'admin',
  'api',
  'www',
  'platform',
  'gateway',
  'flux',
  'default',
])

class MockTenantStore {
  private tenants: Tenant[] = clone(SEED_TENANTS)
  private listeners = new Set<Listener>()
  private timers = new Map<string, ReturnType<typeof setInterval>>()

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    for (const l of this.listeners) l()
  }

  private find(id: string): Tenant | undefined {
    return this.tenants.find((t) => t.id === id)
  }

  private findBySlug(slug: string): Tenant | undefined {
    return this.tenants.find((t) => t.slug === slug)
  }

  listTenants(filters: TenantListFilters = {}): Tenant[] {
    let result = [...this.tenants]
    if (!filters.includeArchived) {
      result = result.filter((t) => t.status !== 'ARCHIVED')
    }
    if (filters.tier) {
      result = result.filter((t) => t.tier === filters.tier)
    }
    if (filters.status) {
      result = result.filter((t) => t.status === filters.status)
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  getTenant(id: string): Tenant | null {
    const t = this.find(id)
    return t ? clone(t) : null
  }

  getTenantBySlug(slug: string): Tenant | null {
    const t = this.findBySlug(slug)
    return t ? clone(t) : null
  }

  checkSlugAvailability(slug: string): { available: boolean; reason: string | null } {
    const normalized = slug.trim().toLowerCase()
    if (!normalized) {
      return { available: false, reason: 'Slug is required' }
    }
    if (!SLUG_PATTERN.test(normalized)) {
      return {
        available: false,
        reason: 'Slug must be lowercase letters, numbers, and hyphens only',
      }
    }
    if (RESERVED_SLUGS.has(normalized)) {
      return { available: false, reason: `Slug is reserved: ${normalized}` }
    }
    if (this.findBySlug(normalized)) {
      return { available: false, reason: 'Tenant slug already exists' }
    }
    return { available: true, reason: null }
  }

  createTenant(req: TenantCreateRequest): Tenant {
    const slug = req.slug.trim().toLowerCase()
    if (this.findBySlug(slug)) {
      throw new Error(`Tenant slug "${slug}" already exists`)
    }
    const id = `tenant-${slug}`
    const tenant: Tenant = {
      id,
      slug,
      displayName: req.displayName.trim(),
      tier: req.tier,
      status: 'PROVISIONING',
      hostUrl: hostUrlForSlug(slug, req.tier),
      namespace: namespaceForTier(slug, req.tier),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      archivedAt: null,
      dbName: dbNameForTier(slug, req.tier),
      searchIndex: `tripentity-${slug}`,
      firestoreDatabase: isEnterpriseLike(req.tier) ? `(default)-${slug}` : null,
      gcsBucket: isEnterpriseLike(req.tier) ? `tripplanning-ent-${slug}-images` : null,
      frontendPath: frontendPathForTier(slug, req.tier),
      imageTag: isEnterpriseLike(req.tier) ? `enterprise-${slug}` : null,
      provisioningError: null,
      estimatedMonthlyCostEur: estimatedCostForTier(req.tier),
      provisioningSteps: stepsForTier(req.tier),
      users: [],
    }

    this.tenants.push(tenant)
    this.startProvisioning(id)
    this.notify()
    return clone(tenant)
  }

  private startProvisioning(id: string): void {
    const existing = this.timers.get(id)
    if (existing) clearInterval(existing)

    let stepIndex = 0
    const timer = setInterval(() => {
      const tenant = this.find(id)
      if (!tenant || tenant.status !== 'PROVISIONING') {
        clearInterval(timer)
        this.timers.delete(id)
        return
      }

      const total = stepCount(tenant.tier)
      const steps = isEnterpriseLike(tenant.tier) ? enterpriseSteps(stepIndex) : standardSteps(stepIndex)

      if (stepIndex >= total) {
        tenant.status = 'ACTIVE'
        tenant.provisioningSteps = isEnterpriseLike(tenant.tier) ? enterpriseSteps(total) : standardSteps(total)
        tenant.updatedAt = nowIso()
        clearInterval(timer)
        this.timers.delete(id)
      } else {
        tenant.provisioningSteps = steps
        tenant.updatedAt = nowIso()
        stepIndex += 1
      }

      this.notify()
    }, 3000)

    this.timers.set(id, timer)
  }

  archiveTenant(id: string): Tenant | null {
    const tenant = this.find(id)
    if (!tenant || tenant.slug === 'free') return null

    const timer = this.timers.get(id)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(id)
    }

    tenant.status = 'ARCHIVED'
    tenant.archivedAt = nowIso()
    tenant.updatedAt = nowIso()
    this.notify()
    return clone(tenant)
  }

  updateBranding(id: string, body: { primaryColor?: string | null; headerTitle?: string | null; iconUrl?: string | null; titleRetractToInitials?: boolean | null; invertHeaderIcon?: boolean | null }): Tenant {
    const tenant = this.find(id)
    if (!tenant) throw new Error('Tenant not found')
    if (body.primaryColor !== undefined) tenant.primaryColor = body.primaryColor || null
    if (body.headerTitle !== undefined) tenant.headerTitle = body.headerTitle
    if (body.iconUrl !== undefined) tenant.iconUrl = body.iconUrl || null
    if (body.titleRetractToInitials !== undefined && body.titleRetractToInitials !== null) {
      tenant.titleRetractToInitials = body.titleRetractToInitials
    }
    if (body.invertHeaderIcon !== undefined && body.invertHeaderIcon !== null) {
      tenant.invertHeaderIcon = body.invertHeaderIcon
    }
    tenant.updatedAt = nowIso()
    this.notify()
    return clone(tenant)
  }

  uploadBrandingIcon(id: string, file: File): string {
    const tenant = this.find(id)
    if (!tenant) throw new Error('Tenant not found')
    const objectUrl = URL.createObjectURL(file)
    tenant.iconUrl = objectUrl
    tenant.updatedAt = nowIso()
    this.notify()
    return objectUrl
  }

  retryTenant(id: string): Tenant | null {
    const tenant = this.find(id)
    if (!tenant || tenant.status !== 'FAILED') return null

    tenant.status = 'PROVISIONING'
    tenant.provisioningError = null
    tenant.provisioningSteps = stepsForTier(tenant.tier)
    tenant.updatedAt = nowIso()
    this.startProvisioning(id)
    this.notify()
    return clone(tenant)
  }

  listTenantUsers(tenantId: string): TenantUser[] {
    const tenant = this.find(tenantId)
    return tenant ? clone(tenant.users) : []
  }

  deleteTenantUser(tenantId: string, userId: number): boolean {
    const tenant = this.find(tenantId)
    if (!tenant) return false
    const before = tenant.users.length
    tenant.users = tenant.users.filter((u) => u.id !== userId)
    if (tenant.users.length !== before) {
      tenant.updatedAt = nowIso()
      this.notify()
      return true
    }
    return false
  }

  listPublicUsers(slug: string): TenantUser[] {
    const tenant = this.findBySlug(slug === '' ? 'free' : slug)
    if (!tenant || tenant.status !== 'ACTIVE') return []
    return clone(tenant.users)
  }

  /** Advance startup-io and enterprise-ltd provisioning for demo animation */
  startDemoAnimations(): void {
    this.advanceProvisioningDemo('tenant-startup-io', 1)
    this.advanceProvisioningDemo('tenant-enterprise-ltd', 2)
  }

  private advanceProvisioningDemo(id: string, everyMs: number): void {
    const tenant = this.find(id)
    if (!tenant || tenant.status !== 'PROVISIONING') return

    const timer = setInterval(() => {
      const t = this.find(id)
      if (!t || t.status !== 'PROVISIONING') {
        clearInterval(timer)
        return
      }

      const done = t.provisioningSteps.filter((s) => s.status === 'done').length
      const total = stepCount(t.tier)

      if (done >= total) {
        t.status = 'ACTIVE'
        t.provisioningSteps = isEnterpriseLike(t.tier) ? enterpriseSteps(total) : standardSteps(total)
        t.updatedAt = nowIso()
        clearInterval(timer)
      } else {
        t.provisioningSteps = isEnterpriseLike(t.tier) ? enterpriseSteps(done + 1) : standardSteps(done + 1)
        t.updatedAt = nowIso()
      }
      this.notify()
    }, everyMs * 3000)

    this.timers.set(`demo-${id}`, timer)
  }
}

export const mockTenantStore = new MockTenantStore()

if (import.meta.env.VITE_DEMO_MODE === 'true') {
  mockTenantStore.startDemoAnimations()
}
