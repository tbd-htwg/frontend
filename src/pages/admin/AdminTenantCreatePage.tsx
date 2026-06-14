import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkTenantSlugAvailability, createTenant } from '../../api/tenants'
import { StubProvisioningBanner } from '../../components/admin/StubProvisioningBanner'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { TenantTier } from '../../types/tenant'

type SlugAvailabilityState = 'idle' | 'checking' | 'available' | 'unavailable'

const tierHelp: Record<Exclude<TenantTier, 'FREE'>, string> = {
  STANDARD:
    '{slug}.k8s.tbd-htwg.de — shared namespace; Terraform dispatch for DNS/DB; std:{slug} Valkey prefix',
  ENTERPRISE:
    '{slug}.enterprise.k8s.tbd-htwg.de — tripplanning-ent-{slug} namespace; Terraform + GitOps dispatch',
}

const tierLabels: Record<Exclude<TenantTier, 'FREE'>, string> = {
  STANDARD: 'Standard',
  ENTERPRISE: 'Enterprise',
}

export function AdminTenantCreatePage() {
  const navigate = useNavigate()
  const [slug, setSlug] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [tier, setTier] = useState<Exclude<TenantTier, 'FREE'>>('STANDARD')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [slugAvailability, setSlugAvailability] = useState<SlugAvailabilityState>('idle')
  const [slugAvailabilityReason, setSlugAvailabilityReason] = useState<string | null>(null)
  const debouncedSlug = useDebouncedValue(slug.trim().toLowerCase(), 300)

  useEffect(() => {
    if (!debouncedSlug) {
      setSlugAvailability('idle')
      setSlugAvailabilityReason(null)
      return
    }

    let cancelled = false
    setSlugAvailability('checking')
    setSlugAvailabilityReason(null)

    void checkTenantSlugAvailability(debouncedSlug).then((result) => {
      if (cancelled) return
      if (result.available) {
        setSlugAvailability('available')
        setSlugAvailabilityReason(null)
      } else {
        setSlugAvailability('unavailable')
        setSlugAvailabilityReason(result.reason ?? 'Slug is not available')
      }
    }).catch(() => {
      if (cancelled) return
      setSlugAvailability('unavailable')
      setSlugAvailabilityReason('Could not verify slug availability')
    })

    return () => {
      cancelled = true
    }
  }, [debouncedSlug])

  const normalizedSlug = slug.trim().toLowerCase()
  const hostPreview =
    tier === 'ENTERPRISE'
      ? `${normalizedSlug || '…'}.enterprise.k8s.tbd-htwg.de`
      : `${normalizedSlug || '…'}.k8s.tbd-htwg.de`
  const slugReady = slugAvailability === 'available'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const normalizedSlug = slug.trim().toLowerCase()
    if (!slugReady) {
      setError(slugAvailabilityReason ?? 'Choose an available slug before creating.')
      return
    }
    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }

    setSubmitting(true)
    try {
      const tenant = await createTenant({
        slug: normalizedSlug,
        displayName: displayName.trim(),
        tier,
      })
      navigate(`/admin/tenants/${tenant.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <StubProvisioningBanner />
      <div>
        <Link to="/admin/tenants" className="text-sm text-blue-600 hover:underline">
          ← Back to tenants
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Create tenant</h1>
        <p className="mt-1 text-sm text-slate-600">
          Admin-only — public self-registration is disabled until pricing is configured.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-lg border border-slate-200 bg-white p-6"
      >
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Slug</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="acme-corp"
            className={[
              'w-full rounded-md border px-3 py-2 text-sm',
              slugAvailability === 'available'
                ? 'border-emerald-400'
                : slugAvailability === 'unavailable'
                  ? 'border-red-400'
                  : 'border-slate-300',
            ].join(' ')}
            required
            aria-invalid={slugAvailability === 'unavailable'}
            aria-describedby="slug-availability-hint"
          />
          <span className="text-xs text-slate-500">
            Host: {hostPreview}
          </span>
          <p
            id="slug-availability-hint"
            className={[
              'text-xs',
              slugAvailability === 'checking'
                ? 'text-slate-500'
                : slugAvailability === 'available'
                  ? 'text-emerald-700'
                  : slugAvailability === 'unavailable'
                    ? 'text-red-700'
                    : 'text-slate-500',
            ].join(' ')}
            aria-live="polite"
          >
            {slugAvailability === 'idle' && 'Lowercase letters, numbers, and hyphens only.'}
            {slugAvailability === 'checking' && 'Checking availability…'}
            {slugAvailability === 'available' && 'Slug is available'}
            {slugAvailability === 'unavailable' && (slugAvailabilityReason ?? 'Slug is not available')}
          </p>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Acme Corp"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">Tier</legend>
          {(['STANDARD', 'ENTERPRISE'] as const).map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                tier === t ? 'border-slate-800 bg-slate-50' : 'border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="tier"
                value={t}
                checked={tier === t}
                onChange={() => setTier(t)}
                className="mt-1"
              />
              <span>
                <span className="font-medium text-slate-900">{tierLabels[t]}</span>
                <p className="text-xs text-slate-600">{tierHelp[t]}</p>
              </span>
            </label>
          ))}
        </fieldset>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !slugReady}
          className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create and provision'}
        </button>
      </form>
    </div>
  )
}
