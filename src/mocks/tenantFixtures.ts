import type {
  ProvisioningStep,
  Tenant,
  TenantTier,
  TenantUser,
} from '../types/tenant'

const HOST_BASE = 'k8s.tbd-htwg.de'
const ENTERPRISE_HOST_BASE = 'enterprise.k8s.tbd-htwg.de'

export function hostUrlForSlug(slug: string, tier: TenantTier = 'STANDARD'): string {
  if (slug === 'free' || tier === 'FREE') return `https://${HOST_BASE}`
  if (tier === 'ENTERPRISE') return `https://${slug}.${ENTERPRISE_HOST_BASE}`
  return `https://${slug}.${HOST_BASE}`
}

export function namespaceForTier(slug: string, tier: TenantTier): string {
  if (tier === 'FREE') return 'tripplanning-free'
  if (tier === 'STANDARD') return 'tripplanning-standard'
  return `tripplanning-ent-${slug}`
}

export function dbNameForTier(slug: string, tier: TenantTier): string | null {
  if (tier === 'FREE') return 'tripplanning'
  if (tier === 'STANDARD') return `tripplanning_std_${slug.replace(/-/g, '_')}`
  return `tripplanning_ent_${slug.replace(/-/g, '_')}`
}

export function frontendPathForTier(slug: string, tier: TenantTier): string | null {
  if (tier === 'STANDARD') return `/standard/${slug}/`
  if (tier === 'ENTERPRISE') return `/enterprise/${slug}/`
  return null
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
    step('identity_platform', 'Identity Platform tenant', 'pending'),
    step('terraform_infra', 'Terraform DNS + DB + secrets', 'pending'),
    step('gitops', 'API router + tenant config', 'pending'),
    step('search_index', 'Search index bootstrap', 'pending'),
  ]
  return keys.map((s, i) => {
    if (failedAt !== undefined && i === failedAt) return { ...s, status: 'failed' }
    if (i < doneThrough) return { ...s, status: 'done' }
    if (i === doneThrough) return { ...s, status: 'running' }
    return s
  })
}

export function enterpriseSteps(
  doneThrough: number,
  failedAt?: number,
): ProvisioningStep[] {
  const keys: ProvisioningStep[] = [
    step('registry', 'Registry entry', 'pending'),
    step('identity_platform', 'Identity Platform tenant', 'pending'),
    step('terraform_infra', 'Terraform DNS + Cloud SQL + bucket', 'pending'),
    step('gitops', 'Namespace + HelmRelease + LB', 'pending'),
    step('database', 'Dedicated Postgres ready', 'pending'),
    step('search_index', 'Dedicated OpenSearch ready', 'pending'),
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
  const steps = tier === 'ENTERPRISE' ? enterpriseSteps(7) : standardSteps(5)
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
    hostUrl: hostUrlForSlug(slug, tier),
    namespace: namespaceForTier(slug, tier),
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    dbName: dbNameForTier(slug, tier),
    searchIndex: tier === 'FREE' ? 'tripentity' : `tripentity-${slug}`,
    firestoreDatabase: tier === 'ENTERPRISE' ? `(default)-${slug}` : null,
    gcsBucket: tier === 'ENTERPRISE' ? `tripplanning-ent-${slug}-images` : null,
    frontendPath: frontendPathForTier(slug, tier),
    imageTag: tier === 'ENTERPRISE' ? `enterprise-${slug}` : null,
    provisioningError: null,
    estimatedMonthlyCostEur: estimatedCostForTier(tier),
    provisioningSteps: status === 'ACTIVE' || status === 'ARCHIVED'
      ? activeSteps(tier)
      : [],
    users: usersForTenant(slug),
    titleRetractToInitials: slug === 'free',
    invertHeaderIcon: slug === 'free',
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
    provisioningSteps: standardSteps(2),
  }),
  baseTenant('tenant-enterprise-ltd', 'enterprise-ltd', 'Enterprise Ltd', 'ENTERPRISE', 'PROVISIONING', {
    createdAt: '2026-06-08T08:00:00Z',
    updatedAt: '2026-06-08T08:06:00Z',
    provisioningSteps: enterpriseSteps(3),
  }),
  baseTenant('tenant-broken-demo', 'broken-demo', 'Broken Demo', 'STANDARD', 'FAILED', {
    createdAt: '2026-05-20T11:00:00Z',
    provisioningError: 'Terraform apply failed: OpenSearch index bootstrap timed out (tripplanning-standard)',
    provisioningSteps: standardSteps(3, 4),
  }),
  baseTenant('tenant-old-beta', 'old-beta', 'Old Beta', 'STANDARD', 'ARCHIVED', {
    createdAt: '2025-11-01T12:00:00Z',
    archivedAt: '2026-04-01T16:00:00Z',
    provisioningSteps: activeSteps('STANDARD'),
  }),
]
