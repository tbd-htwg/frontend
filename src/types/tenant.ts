export type TenantTier = 'FREE' | 'STANDARD' | 'ENTERPRISE'

export type TenantStatus =
  | 'PENDING'
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'FAILED'
  | 'ARCHIVED'

export type ProvisioningStepStatus = 'pending' | 'running' | 'done' | 'failed'

export type ProvisioningStepKey =
  | 'registry'
  | 'identity_platform'
  | 'terraform_infra'
  | 'gitops'
  | 'database'
  | 'search_index'
  | 'gcp_resources'

export type ProvisioningStep = {
  key: ProvisioningStepKey
  label: string
  status: ProvisioningStepStatus
}

export type TenantUser = {
  id: number
  name: string
  email: string
  description: string
}

export type Tenant = {
  id: string
  slug: string
  displayName: string
  tier: TenantTier
  status: TenantStatus
  hostUrl: string
  namespace: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  dbName: string | null
  searchIndex: string | null
  firestoreDatabase: string | null
  gcsBucket: string | null
  provisioningError: string | null
  estimatedMonthlyCostEur: number
  provisioningSteps: ProvisioningStep[]
  users: TenantUser[]
  primaryColor?: string | null
  headerTitle?: string | null
  iconUrl?: string | null
  titleRetractToInitials?: boolean
  invertHeaderIcon?: boolean
  frontendPath?: string | null
  imageTag?: string | null
  resourceConfig?: TenantResourceConfig
}

export type ResourceSize = 'SMALL' | 'MEDIUM' | 'LARGE'

export type TenantServiceResource = {
  size: ResourceSize
  replicas: number
  minReplicas: number
  maxReplicas: number
}

export type TenantResourceConfig = {
  autoscalingEnabled: boolean
  trip: TenantServiceResource
  social: TenantServiceResource
  externalInfo: TenantServiceResource
}

export type PublicTenantConfig = {
  slug: string
  tier: TenantTier
  status: TenantStatus
  hostUrl: string
  identityPlatformTenantId: string | null
  enabledAuthProviders: string[]
  primaryColor: string | null
  headerTitle: string | null
  iconUrl: string | null
  titleRetractToInitials: boolean
  invertHeaderIcon: boolean
  frontendPath: string | null
}

export type TenantBrandingUpdateRequest = {
  primaryColor?: string | null
  headerTitle?: string | null
  iconUrl?: string | null
  titleRetractToInitials?: boolean | null
  invertHeaderIcon?: boolean | null
}

export type TenantCreateRequest = {
  slug: string
  displayName: string
  tier: Exclude<TenantTier, 'FREE'>
}

export type TenantListFilters = {
  tier?: TenantTier
  status?: TenantStatus
  includeArchived?: boolean
}
