import type { TenantStatus } from '../../types/tenant'

const styles: Record<TenantStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 ring-slate-300',
  PROVISIONING: 'bg-blue-100 text-blue-800 ring-blue-300 animate-pulse',
  ACTIVE: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  FAILED: 'bg-red-100 text-red-800 ring-red-300',
  ARCHIVED: 'bg-slate-200 text-slate-600 ring-slate-400',
}

const labels: Record<TenantStatus, string> = {
  PENDING: 'Pending',
  PROVISIONING: 'Provisioning',
  ACTIVE: 'Active',
  FAILED: 'Failed',
  ARCHIVED: 'Archived',
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
