import type { TenantTier } from '../types/tenant'

/** Enterprise-capable tiers (custom fields, dedicated Firestore collections, etc.). */
export function tierSupportsCustomFields(tier: TenantTier): boolean {
  return tier === 'ENTERPRISE' || tier === 'DEVELOP'
}

/** Tiers that can edit pod sizing / autoscaling from the admin UI. */
export function tierSupportsResourceScaling(tier: TenantTier): boolean {
  return tier === 'ENTERPRISE' || tier === 'DEVELOP'
}
