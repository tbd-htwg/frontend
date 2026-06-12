import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { archiveTenant, getTenant, retryTenant, updateTenantBranding } from '../../api/tenants'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { ProvisioningTimeline } from '../../components/admin/ProvisioningTimeline'
import { TenantCostHint } from '../../components/admin/TenantCostHint'
import { TenantStatusBadge } from '../../components/admin/TenantStatusBadge'
import { TenantTierBadge } from '../../components/admin/TenantTierBadge'
import { useMockTenantRefresh } from '../../hooks/useMockTenantRefresh'
import type { Tenant } from '../../types/tenant'

type Tab = 'overview' | 'branding' | 'users' | 'cost'

export function AdminTenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [brandingTitle, setBrandingTitle] = useState('')
  const [brandingColor, setBrandingColor] = useState('')
  const [brandingIcon, setBrandingIcon] = useState('')
  const refreshTick = useMockTenantRefresh()

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)

    getTenant(id)
      .then((t) => {
        if (!cancelled) {
          setTenant(t)
          setError(t ? null : 'Tenant not found')
          if (t) {
            setBrandingTitle(t.headerTitle ?? t.displayName)
            setBrandingColor(t.primaryColor ?? '')
            setBrandingIcon(t.iconUrl ?? '')
          }
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load tenant')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, refreshTick])

  useEffect(() => {
    if (!id || tenant?.status !== 'PROVISIONING') return
    const interval = setInterval(() => {
      getTenant(id).then((t) => {
        if (t) setTenant(t)
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [id, tenant?.status])

  async function handleRetry() {
    if (!id) return
    setActionLoading(true)
    try {
      await retryTenant(id)
      const updated = await getTenant(id)
      if (updated) setTenant(updated)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleArchive() {
    if (!id) return
    setActionLoading(true)
    try {
      await archiveTenant(id)
      setArchiveOpen(false)
      navigate('/admin/tenants')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading tenant…</p>
  }

  if (error || !tenant) {
    return (
      <div className="space-y-4">
        <Link to="/admin/tenants" className="text-sm text-blue-600 hover:underline">
          ← Back to tenants
        </Link>
        <p className="text-red-700" role="alert">
          {error ?? 'Tenant not found'}
        </p>
      </div>
    )
  }

  const tabClass = (t: Tab) =>
    [
      'rounded-md px-3 py-2 text-sm font-medium',
      tab === t ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100',
    ].join(' ')

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/tenants" className="text-sm text-blue-600 hover:underline">
          ← Back to tenants
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{tenant.displayName}</h1>
          <TenantTierBadge tier={tenant.tier} />
          <TenantStatusBadge status={tenant.status} />
        </div>
        <p className="mt-1 text-sm text-slate-600">{tenant.slug}</p>
      </div>

      {tenant.status === 'ACTIVE' && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Tenant is active.{' '}
          <a href={tenant.hostUrl} className="font-medium underline">
            {tenant.hostUrl}
          </a>
          {' · '}
          <Link
            to={`/users?tenant=${tenant.slug}`}
            className="font-medium underline"
          >
            View public user directory
          </Link>
        </div>
      )}

      {tenant.status === 'PROVISIONING' && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Provisioning in progress — this may take a few minutes. Steps update automatically.
        </div>
      )}

      {tenant.status === 'FAILED' && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-4 text-sm text-red-900">
          <p className="font-semibold">Provisioning failed</p>
          <p className="mt-1">{tenant.provisioningError}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleRetry}
              disabled={actionLoading}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              Retry provisioning
            </button>
            <button
              type="button"
              onClick={() => setArchiveOpen(true)}
              disabled={actionLoading || tenant.slug === 'free'}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Archive
            </button>
          </div>
        </div>
      )}

      {tenant.status === 'ARCHIVED' && (
        <div className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-600">
          Archived on{' '}
          {tenant.archivedAt
            ? new Date(tenant.archivedAt).toLocaleString()
            : 'unknown date'}
          . Resources retained; read-only view.
        </div>
      )}

      {(tenant.status === 'PROVISIONING' || tenant.status === 'PENDING') && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Provisioning steps</h2>
          <ProvisioningTimeline steps={tenant.provisioningSteps} />
        </section>
      )}

      {tenant.status !== 'ARCHIVED' && tenant.slug !== 'free' && tenant.status === 'ACTIVE' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Archive tenant
          </button>
        </div>
      )}

      <nav className="flex gap-2 border-b border-slate-200 pb-2">
        <button type="button" className={tabClass('overview')} onClick={() => setTab('overview')}>
          Overview
        </button>
        <button type="button" className={tabClass('branding')} onClick={() => setTab('branding')}>
          Branding
        </button>
        <button type="button" className={tabClass('users')} onClick={() => setTab('users')}>
          Users
        </button>
        <button type="button" className={tabClass('cost')} onClick={() => setTab('cost')}>
          Cost
        </button>
      </nav>

      {tab === 'overview' && (
        <dl className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-500">Namespace</dt>
            <dd className="font-mono text-sm">{tenant.namespace}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Host</dt>
            <dd className="text-sm">{tenant.hostUrl}</dd>
          </div>
          {tenant.dbName && (
            <div>
              <dt className="text-xs uppercase text-slate-500">Database</dt>
              <dd className="font-mono text-sm">{tenant.dbName}</dd>
            </div>
          )}
          {tenant.searchIndex && (
            <div>
              <dt className="text-xs uppercase text-slate-500">Search index</dt>
              <dd className="font-mono text-sm">{tenant.searchIndex}</dd>
            </div>
          )}
          {tenant.firestoreDatabase && (
            <div>
              <dt className="text-xs uppercase text-slate-500">Firestore</dt>
              <dd className="font-mono text-sm">{tenant.firestoreDatabase}</dd>
            </div>
          )}
          {tenant.gcsBucket && (
            <div>
              <dt className="text-xs uppercase text-slate-500">GCS bucket</dt>
              <dd className="font-mono text-sm">{tenant.gcsBucket}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase text-slate-500">Created</dt>
            <dd className="text-sm">{new Date(tenant.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      )}

      {tab === 'branding' && tenant.tier !== 'FREE' && (
        <form
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
          onSubmit={async (e) => {
            e.preventDefault()
            setActionLoading(true)
            try {
              const updated = await updateTenantBranding(tenant.id, {
                headerTitle: brandingTitle.trim() || tenant.displayName,
                primaryColor: brandingColor.trim() || null,
                iconUrl: brandingIcon.trim() || null,
              })
              setTenant(updated)
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : 'Failed to save branding')
            } finally {
              setActionLoading(false)
            }
          }}
        >
          <p className="text-sm text-slate-600">
            Standard tier customisation: header title, colorway, and icon (frontend only).
          </p>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Header title</span>
            <input
              type="text"
              value={brandingTitle}
              onChange={(e) => setBrandingTitle(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Primary color (CSS)</span>
            <input
              type="text"
              value={brandingColor}
              onChange={(e) => setBrandingColor(e.target.value)}
              placeholder="#2563eb"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Icon URL</span>
            <input
              type="url"
              value={brandingIcon}
              onChange={(e) => setBrandingIcon(e.target.value)}
              placeholder="/cloud-regular-full.svg"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={actionLoading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Save branding
          </button>
        </form>
      )}

      {tab === 'users' && (
        <div>
          <Link
            to={`/admin/tenants/${tenant.id}/users`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Manage users (delete) →
          </Link>
          <p className="mt-2 text-sm text-slate-600">
            {tenant.users.length} user{tenant.users.length === 1 ? '' : 's'} in this tenant
          </p>
        </div>
      )}

      {tab === 'cost' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <TenantCostHint
            tier={tenant.tier}
            estimatedMonthlyCostEur={tenant.estimatedMonthlyCostEur}
          />
          <p className="mt-3 text-sm text-slate-600">
            Estimate based on M3 tier resource profiles (Helm sizing + optional GCP managed
            services). Real billing integration is planned for M3 Phase 7.
          </p>
          <a
            href="https://cloud.google.com/products/calculator"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            Open GCP Pricing Calculator
          </a>
        </div>
      )}

      <ConfirmDialog
        open={archiveOpen}
        title="Archive tenant"
        message={`Archive "${tenant.displayName}"? The tenant will be hidden from the default list. Infrastructure is not torn down.`}
        confirmLabel="Archive"
        destructive
        onConfirm={handleArchive}
        onCancel={() => setArchiveOpen(false)}
      />
    </div>
  )
}
