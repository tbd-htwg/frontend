import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTenants } from '../../api/tenants'
import { TenantCostHint } from '../../components/admin/TenantCostHint'
import { TenantStatusBadge } from '../../components/admin/TenantStatusBadge'
import { StubProvisioningBanner } from '../../components/admin/StubProvisioningBanner'
import { TenantTierBadge } from '../../components/admin/TenantTierBadge'
import { useMockTenantRefresh } from '../../hooks/useMockTenantRefresh'
import type { Tenant, TenantStatus, TenantTier } from '../../types/tenant'

export function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tierFilter, setTierFilter] = useState<TenantTier | ''>('')
  const [statusFilter, setStatusFilter] = useState<TenantStatus | ''>('')
  const [showArchived, setShowArchived] = useState(false)
  const refreshTick = useMockTenantRefresh()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listTenants({
      tier: tierFilter || undefined,
      status: statusFilter || undefined,
      includeArchived: showArchived,
    })
      .then((data) => {
        if (!cancelled) {
          setTenants(data)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load tenants')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tierFilter, statusFilter, showArchived, refreshTick])

  const hasInProgressTenants = tenants.some(
    (t) => t.status === 'PROVISIONING' || t.status === 'PENDING',
  )

  useEffect(() => {
    if (!hasInProgressTenants) return
    const interval = setInterval(() => {
      listTenants({
        tier: tierFilter || undefined,
        status: statusFilter || undefined,
        includeArchived: showArchived,
      }).then((data) => setTenants(data))
    }, 2000)
    return () => clearInterval(interval)
  }, [hasInProgressTenants, tierFilter, statusFilter, showArchived])

  return (
    <div className="space-y-6">
      <StubProvisioningBanner />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Cross-tier overview — Free, Standard pool, and Enterprise silos
          </p>
        </div>
        <Link
          to="/admin/platform-admins"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Manage admins
        </Link>
        <Link
          to="/admin/tenants/new"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          Create tenant
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Tier</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as TenantTier | '')}
            className="rounded-md border border-slate-300 px-2 py-1"
          >
            <option value="">All</option>
            <option value="FREE">Free</option>
            <option value="STANDARD">Standard</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TenantStatus | '')}
            className="rounded-md border border-slate-300 px-2 py-1"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="PROVISIONING">Provisioning</option>
            <option value="FAILED">Failed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Loading tenants…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="tenant-admin-table min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3">Tenant</th>
                <th className="border-b border-slate-200 px-4 py-3">Tier</th>
                <th className="border-b border-slate-200 px-4 py-3">Status</th>
                <th className="border-b border-slate-200 px-4 py-3">Host</th>
                <th className="border-b border-slate-200 px-4 py-3">Est. cost</th>
                <th className="border-b border-slate-200 px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-t [&>tr]:border-slate-200">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/tenants/${t.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {t.displayName}
                    </Link>
                    <p className="text-xs text-slate-500">{t.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <TenantTierBadge tier={t.tier} />
                  </td>
                  <td className="px-4 py-3">
                    <TenantStatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    {t.status === 'ACTIVE' ? (
                      <a
                        href={t.hostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {t.hostUrl.replace('https://', '')}
                      </a>
                    ) : (
                      <span className="text-slate-500">{t.hostUrl.replace('https://', '')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TenantCostHint
                      tier={t.tier}
                      estimatedMonthlyCostEur={t.estimatedMonthlyCostEur}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tenants.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No tenants match filters.</p>
          )}
        </div>
      )}
    </div>
  )
}
