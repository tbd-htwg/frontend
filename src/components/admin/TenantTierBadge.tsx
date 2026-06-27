import type { TenantTier } from '../../types/tenant'

const styles: Record<TenantTier, string> = {
  FREE: 'bg-slate-100 text-slate-800 ring-slate-300',
  STANDARD: 'bg-blue-100 text-blue-800 ring-blue-300',
  ENTERPRISE: 'bg-amber-100 text-amber-900 ring-amber-300',
  DEVELOP: 'bg-violet-100 text-violet-900 ring-violet-300',
}

const labels: Record<TenantTier, string> = {
  FREE: 'Free',
  STANDARD: 'Standard',
  ENTERPRISE: 'Enterprise',
  DEVELOP: 'Develop',
}

export function TenantTierBadge({ tier }: { tier: TenantTier }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[tier]}`}
    >
      {labels[tier]}
    </span>
  )
}
