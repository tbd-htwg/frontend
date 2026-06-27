import type { TenantTier } from '../types/tenant'

/** Enterprise-capable tiers (custom fields, dedicated Firestore collections, etc.). */
export function tierSupportsCustomFields(tier: TenantTier): boolean {
  return tier === 'ENTERPRISE' || tier === 'DEVELOP'
}
