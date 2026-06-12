import type {
  ProvisioningStep,
  Tenant,
  TenantTier,
  TenantUser,
} from '../types/tenant'

const HOST_BASE = 'k8s.tbd-htwg.de'

export function hostUrlForSlug(slug: string): string {
  if (slug === 'free') return `https://${HOST_BASE}`
  return `https://${slug}.${HOST_BASE}`
}

export function namespaceForTier(slug: string, tier: TenantTier): string {
  if (tier === 'FREE') return 'tripplanning-free'
  if (tier === 'STANDARD') return 'tripplanning-standard'
  return `tripplanning-${slug}`
}

export function estimatedCostForTier(tier: TenantTier): number {
  if (tier === 'FREE') return 0
  if (tier === 'STANDARD') return 45
  return 180
}

function step(
  key: ProvisioningStep['key'],
  label: string,
  status: ProvisioningStep['status'],
): ProvisioningStep {
  return { key, label, status }
}

export function standardSteps(
  doneThrough: number,
  failedAt?: number,
): ProvisioningStep[] {
  const keys: ProvisioningStep[] = [
    step('registry', 'Registry entry', 'pending'),
    step('database', 'Create database', 'pending'),
    step('search_index', 'Create search index', 'pending'),
  ]
  return keys.map((s, i) => {
    if (failedAt !== undefined && i === failedAt) return { ...s, status: 'failed' }
    if (i < doneThrough) return { ...s, status: 'done' }
    if (i === doneThrough) return { ...s, status: 'running' }
    return s
  })
}

export function premiumSteps(
  doneThrough: number,
  failedAt?: number,
): ProvisioningStep[] {
  const keys: ProvisioningStep[] = [
    step('registry', 'Registry entry', 'pending'),
    step('entry_routing', 'Identity Platform + DNS + load balancer', 'pending'),
    step('gitops', 'Flux GitOps namespace', 'pending'),
    step('database', 'Dedicated Postgres', 'pending'),
    step('search_index', 'Dedicated OpenSearch', 'pending'),
    step('gcp_resources', 'Firestore + GCS bucket', 'pending'),
  ]
  return keys.map((s, i) => {
    if (failedAt !== undefined && i === failedAt) return { ...s, status: 'failed' }
    if (i < doneThrough) return { ...s, status: 'done' }
    if (i === doneThrough) return { ...s, status: 'running' }
    return s
  })
}

function activeSteps(tier: TenantTier): ProvisioningStep[] {
  const steps = tier === 'PREMIUM' ? premiumSteps(6) : standardSteps(3)
  return steps.map((s) => ({ ...s, status: 'done' as const }))
}

function usersForTenant(slug: string): TenantUser[] {
  const sets: Record<string, TenantUser[]> = {
    free: [
      { id: 1, name: 'Alice Explorer', email: 'alice@example.com', description: 'Weekend hiker' },
      { id: 2, name: 'Bob Nomad', email: 'bob@example.com', description: 'Digital nomad' },
      { id: 3, name: 'Carla Routes', email: 'carla@example.com', description: 'Route planner' },
      { id: 4, name: 'Dan Maps', email: 'dan@example.com', description: 'Map enthusiast' },
      { id: 5, name: 'Eva Trails', email: 'eva@example.com', description: 'Trail runner' },
    ],
    'acme-corp': [
      { id: 101, name: 'Morgan Lee', email: 'morgan@acme-corp.com', description: 'Travel lead' },
      { id: 102, name: 'Jordan Kim', email: 'jordan@acme-corp.com', description: 'Ops manager' },
      { id: 103, name: 'Riley Chen', email: 'riley@acme-corp.com', description: 'Analyst' },
      { id: 104, name: 'Sam Patel', email: 'sam@acme-corp.com', description: 'Engineer' },
      { id: 105, name: 'Taylor Fox', email: 'taylor@acme-corp.com', description: 'Designer' },
      { id: 106, name: 'Casey Wu', email: 'casey@acme-corp.com', description: 'Support' },
    ],
    'startup-io': [
      { id: 201, name: 'Alex Founder', email: 'alex@startup.io', description: 'CEO' },
      { id: 202, name: 'Jamie CTO', email: 'jamie@startup.io', description: 'CTO' },
    ],
    'enterprise-ltd': [
      { id: 301, name: 'Victor Exec', email: 'victor@enterprise.ltd', description: 'VP Travel' },
      { id: 302, name: 'Nina Admin', email: 'nina@enterprise.ltd', description: 'Tenant admin' },
    ],
    'broken-demo': [],
    'old-beta': [
      { id: 401, name: 'Legacy User', email: 'legacy@old-beta.test', description: 'Archived tenant user' },
    ],
  }
  return sets[slug] ?? [
    { id: 901, name: 'Demo User', email: 'demo@example.com', description: 'New tenant member' },
  ]
}

function baseTenant(
  id: string,
  slug: string,
  displayName: string,
  tier: TenantTier,
  status: Tenant['status'],
  overrides: Partial<Tenant> = {},
): Tenant {
  const now = '2026-06-01T10:00:00Z'
  return {
    id,
    slug,
    displayName,
    tier,
    status,
    hostUrl: hostUrlForSlug(slug),
    namespace: namespaceForTier(slug, tier),
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    dbName: tier === 'FREE' ? 'tripplanning' : tier === 'STANDARD' ? `tenant_${slug.replace(/-/g, '_')}` : `tripplanning_${slug}`,
    searchIndex: tier === 'FREE' ? 'tripentity' : `tripentity-${slug}`,
    firestoreDatabase: tier === 'PREMIUM' ? `(default)-${slug}` : null,
    gcsBucket: tier === 'PREMIUM' ? `tbd-cloudappdev-images-${slug}` : null,
    provisioningError: null,
    estimatedMonthlyCostEur: estimatedCostForTier(tier),
    provisioningSteps: status === 'ACTIVE' || status === 'ARCHIVED'
      ? activeSteps(tier)
      : [],
    users: usersForTenant(slug),
    ...overrides,
  }
}

export const SEED_TENANTS: Tenant[] = [
  baseTenant('tenant-free', 'free', 'Free Pool', 'FREE', 'ACTIVE', {
    createdAt: '2025-01-15T08:00:00Z',
    dbName: 'tripplanning',
    searchIndex: 'tripentity',
  }),
  baseTenant('tenant-acme-corp', 'acme-corp', 'Acme Corp', 'STANDARD', 'ACTIVE', {
    createdAt: '2026-03-10T14:30:00Z',
    provisioningSteps: activeSteps('STANDARD'),
  }),
  baseTenant('tenant-startup-io', 'startup-io', 'Startup.io', 'STANDARD', 'PROVISIONING', {
    createdAt: '2026-06-08T09:00:00Z',
    updatedAt: '2026-06-08T09:02:00Z',
    provisioningSteps: standardSteps(1),
  }),
  baseTenant('tenant-enterprise-ltd', 'enterprise-ltd', 'Enterprise Ltd', 'PREMIUM', 'PROVISIONING', {
    createdAt: '2026-06-08T08:00:00Z',
    updatedAt: '2026-06-08T08:06:00Z',
    provisioningSteps: premiumSteps(2),
  }),
  baseTenant('tenant-broken-demo', 'broken-demo', 'Broken Demo', 'STANDARD', 'FAILED', {
    createdAt: '2026-05-20T11:00:00Z',
    provisioningError: 'OpenSearch index creation timed out after 120s (tripplanning-standard/opensearch-0 unreachable)',
    provisioningSteps: standardSteps(1, 2),
  }),
  baseTenant('tenant-old-beta', 'old-beta', 'Old Beta', 'STANDARD', 'ARCHIVED', {
    createdAt: '2025-11-01T12:00:00Z',
    archivedAt: '2026-04-01T16:00:00Z',
    provisioningSteps: activeSteps('STANDARD'),
  }),
]
