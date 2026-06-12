import type { TenantTier } from '../../types/tenant'

const GCP_CALCULATOR_URL = 'https://cloud.google.com/products/calculator'

const hints: Record<TenantTier, string> = {
  FREE: 'Sparse in-cluster pool, HPA off, shared Postgres/OpenSearch',
  STANDARD:
    'Shared tripplanning-standard namespace; Terraform dispatch for DNS/DB; DB + index per tenant',
  ENTERPRISE:
    'Dedicated tripplanning-ent-{slug} namespace; Terraform + GitOps dispatch; dedicated backing services',
}

export function TenantCostHint({
  tier,
  estimatedMonthlyCostEur,
}: {
  tier: TenantTier
  estimatedMonthlyCostEur: number
}) {
  const label =
    estimatedMonthlyCostEur === 0
      ? '€0/mo'
      : `~€${estimatedMonthlyCostEur}/mo`

  return (
    <span className="inline-flex items-center gap-1 text-sm text-slate-700" title={hints[tier]}>
      <span className="font-medium">{label}</span>
      <a
        href={GCP_CALCULATOR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:underline"
        title="Open GCP Pricing Calculator"
        onClick={(e) => e.stopPropagation()}
      >
        (est.)
      </a>
    </span>
  )
}
