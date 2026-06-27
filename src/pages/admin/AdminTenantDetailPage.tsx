import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { archiveTenant, getTenant, retryTenant, updateTenantBranding } from '../../api/tenants'
import { AdminTenantCustomFieldsTab } from '../../components/admin/AdminTenantCustomFieldsTab'
import { AppBrand } from '../../components/AppBrand'
import { BrandingIconUpload } from '../../components/admin/BrandingIconUpload'
import { ColorPickerField } from '../../components/admin/ColorPickerField'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { ProvisioningTimeline } from '../../components/admin/ProvisioningTimeline'
import { TenantCostHint } from '../../components/admin/TenantCostHint'
import { TenantStatusBadge } from '../../components/admin/TenantStatusBadge'
import { StubProvisioningBanner } from '../../components/admin/StubProvisioningBanner'
import { TenantTierBadge } from '../../components/admin/TenantTierBadge'
import { tierSupportsCustomFields } from '../../lib/tenantTier'
import { APP_ICON_SRC } from '../../branding'
import {
  tenantHeaderChromeBackground,
  tenantHeaderChromeText,
  tenantPreviewBodyBackground,
} from '../../lib/tenantTheme'
import { useColorScheme } from '../../context/ColorSchemeContext'
import { useTenantBrandingOverride } from '../../context/TenantBrandingContext'
import { useMockTenantRefresh } from '../../hooks/useMockTenantRefresh'
import type { Tenant } from '../../types/tenant'

type Tab = 'overview' | 'branding' | 'users' | 'cost' | 'customFields'

type BrandingSaveStatus = 'idle' | 'success' | 'error'

function savedBrandingPreview(tenant: Tenant) {
  return {
    title: tenant.headerTitle ?? tenant.displayName,
    primaryColor: tenant.primaryColor ?? null,
    iconUrl: tenant.iconUrl ?? APP_ICON_SRC,
    titleRetractToInitials: tenant.titleRetractToInitials ?? false,
    invertHeaderIcon: tenant.invertHeaderIcon ?? tenant.slug === 'free',
  }
}

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
  const [brandingRetract, setBrandingRetract] = useState(false)
  const [brandingInvertIcon, setBrandingInvertIcon] = useState(false)
  const [iconCleared, setIconCleared] = useState(false)
  const [brandingSaveStatus, setBrandingSaveStatus] = useState<BrandingSaveStatus>('idle')
  const refreshTick = useMockTenantRefresh()
  const setBrandingOverride = useTenantBrandingOverride()
  const { colorScheme } = useColorScheme()

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
            setBrandingRetract(t.titleRetractToInitials ?? false)
            setBrandingInvertIcon(t.invertHeaderIcon ?? t.slug === 'free')
            setIconCleared(false)
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
    if (!id || (tenant?.status !== 'PROVISIONING' && tenant?.status !== 'PENDING')) return
    const interval = setInterval(() => {
      getTenant(id).then((t) => {
        if (t) setTenant(t)
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [id, tenant?.status])

  useEffect(() => {
    if (!tenant || tenant.tier === 'FREE' || tab !== 'branding') {
      setBrandingOverride(null)
      return
    }
    setBrandingOverride({
      title: brandingTitle.trim() || tenant.displayName,
      iconUrl: brandingIcon.trim() || APP_ICON_SRC,
      primaryColor: brandingColor.trim() || null,
      titleRetractToInitials: brandingRetract,
      invertHeaderIcon: brandingInvertIcon,
    })
  }, [
    tenant,
    tab,
    brandingTitle,
    brandingColor,
    brandingIcon,
    brandingRetract,
    brandingInvertIcon,
    setBrandingOverride,
  ])

  useEffect(() => () => setBrandingOverride(null), [setBrandingOverride])

  useEffect(() => {
    if (brandingSaveStatus === 'idle') return
    const timer = window.setTimeout(() => setBrandingSaveStatus('idle'), 1000)
    return () => window.clearTimeout(timer)
  }, [brandingSaveStatus])

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

  const savedBranding = savedBrandingPreview(tenant)

  return (
    <div className="space-y-6">
      <StubProvisioningBanner />
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
            to={`/users/?tenant=${tenant.slug}`}
            className="font-medium underline"
          >
            View public user directory
          </Link>
        </div>
      )}

      {tenant.status === 'PROVISIONING' && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Provisioning in progress — this may take several minutes while Terraform and GitOps
          complete. Steps update automatically.
        </div>
      )}

      {tenant.status === 'PENDING' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tenant is queued for provisioning.
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

      {((tenant.status === 'PROVISIONING' || tenant.status === 'PENDING') ||
        (tenant.status === 'ACTIVE' && tenant.provisioningSteps.length > 0)) && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Provisioning steps</h2>
          {tenant.status === 'ACTIVE' ? (
            <details className="group [&_ol]:mt-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
                Provisioning completed — view steps
              </summary>
              <ProvisioningTimeline steps={tenant.provisioningSteps} />
            </details>
          ) : (
            <ProvisioningTimeline steps={tenant.provisioningSteps} />
          )}
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
        {tierSupportsCustomFields(tenant.tier) && (
          <button
            type="button"
            className={tabClass('customFields')}
            onClick={() => setTab('customFields')}
          >
            Custom fields
          </button>
        )}
      </nav>

      {tab === 'overview' && (
        <div className="space-y-6">
          {tenant.tier !== 'FREE' && (
            <section
              className="tenant-branding-preview overflow-hidden rounded-lg border border-slate-200"
              style={
                {
                  ...(savedBranding.primaryColor
                    ? { '--preview-primary': savedBranding.primaryColor }
                    : {}),
                  '--preview-chrome-surface': tenantHeaderChromeBackground(
                    savedBranding.primaryColor,
                    colorScheme,
                  ),
                  '--preview-chrome-text': tenantHeaderChromeText(
                    savedBranding.primaryColor,
                    colorScheme,
                  ),
                  '--preview-body-surface': tenantPreviewBodyBackground(
                    savedBranding.primaryColor,
                    colorScheme,
                  ),
                } as CSSProperties
              }
            >
              <div className="tenant-branding-preview__chrome px-4 py-3">
                <AppBrand
                  preview
                  title={savedBranding.title}
                  iconUrl={savedBranding.iconUrl}
                  retractToInitials={savedBranding.titleRetractToInitials}
                  invertHeaderIcon={savedBranding.invertHeaderIcon}
                  primaryColor={savedBranding.primaryColor}
                />
              </div>
              <div className="tenant-branding-preview__body p-6">
                <h2 className="text-lg font-semibold text-slate-900">Branding</h2>
                <dl className="mt-4 grid gap-3 text-sm sm:max-w-md">
                  <div>
                    <dt className="text-xs uppercase text-slate-500">Primary color</dt>
                    <dd className="mt-1 flex items-center gap-2">
                      {savedBranding.primaryColor ? (
                        <>
                          <span
                            className="inline-block h-5 w-5 rounded border border-slate-300"
                            style={{ backgroundColor: savedBranding.primaryColor }}
                            aria-hidden="true"
                          />
                          <span className="font-mono">{savedBranding.primaryColor}</span>
                        </>
                      ) : (
                        <span className="text-slate-600">Default</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">Header title retraction</dt>
                    <dd className="mt-1 text-slate-900">
                      {savedBranding.titleRetractToInitials
                        ? 'Retract to initials'
                        : 'Full title'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">Invert icon on light header</dt>
                    <dd className="mt-1 text-slate-900">
                      {savedBranding.invertHeaderIcon ? 'Enabled' : 'Disabled'}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          )}

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
        </div>
      )}

      {tab === 'branding' && tenant.tier !== 'FREE' && (
        <form
          className="space-y-6 rounded-lg border border-slate-200 bg-white p-6"
          onSubmit={async (e) => {
            e.preventDefault()
            setBrandingSaveStatus('idle')
            setActionLoading(true)
            try {
              const updated = await updateTenantBranding(tenant.id, {
                headerTitle: brandingTitle.trim() || tenant.displayName,
                primaryColor: brandingColor.trim() || null,
                ...(iconCleared ? { iconUrl: '' } : {}),
                titleRetractToInitials: brandingRetract,
                invertHeaderIcon: brandingInvertIcon,
              })
              setTenant(updated)
              setBrandingIcon(updated.iconUrl ?? '')
              setIconCleared(false)
              setBrandingSaveStatus('success')
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : 'Failed to save branding')
              setBrandingSaveStatus('error')
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
          <ColorPickerField value={brandingColor} onChange={setBrandingColor} />
          <BrandingIconUpload
            tenantId={tenant.id}
            iconUrl={brandingIcon}
            onIconUrlChange={(url) => {
              setBrandingIcon(url)
              setIconCleared(url === '')
            }}
            onUploaded={async () => {
              const refreshed = await getTenant(tenant.id)
              if (refreshed) {
                setTenant(refreshed)
                setBrandingIcon(refreshed.iconUrl ?? '')
                setIconCleared(false)
              }
            }}
          />

          <fieldset className="space-y-3 border-t border-slate-200 pt-4">
            <legend className="text-sm font-semibold text-slate-900">Other</legend>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={brandingRetract}
                onChange={(e) => setBrandingRetract(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                Retract header title to initials
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  Animates the full title to initials after load, e.g. “Trip Blänner Deluxe” →
                  “TBD”.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={brandingInvertIcon}
                onChange={(e) => setBrandingInvertIcon(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                Invert icon on light header text
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  For dark icons on transparent backgrounds when the header uses white or light
                  text (dark primary colors or dark mode).
                </span>
              </span>
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={actionLoading || brandingSaveStatus !== 'idle'}
            className={[
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
              brandingSaveStatus === 'success'
                ? 'bg-emerald-700'
                : brandingSaveStatus === 'error'
                  ? 'bg-red-700'
                  : 'bg-slate-900 hover:bg-slate-800',
            ].join(' ')}
          >
            {actionLoading ? (
              'Saving…'
            ) : brandingSaveStatus === 'success' ? (
              <>
                <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" aria-hidden="true" />
                Saved
              </>
            ) : brandingSaveStatus === 'error' ? (
              <>
                <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" aria-hidden="true" />
                Error
              </>
            ) : (
              'Save branding'
            )}
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

      {tab === 'customFields' && tierSupportsCustomFields(tenant.tier) && (
        <AdminTenantCustomFieldsTab tenantId={tenant.id} />
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
