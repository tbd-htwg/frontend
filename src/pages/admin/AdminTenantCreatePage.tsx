import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createTenant } from '../../api/tenants'
import type { TenantTier } from '../../types/tenant'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const tierHelp: Record<Exclude<TenantTier, 'FREE'>, string> = {
  STANDARD:
    'Shared tripplanning-standard namespace — DB per tenant, index per tenant, Valkey/Firestore prefixes',
  PREMIUM:
    'Dedicated tripplanning-{slug} namespace — isolated Postgres, OpenSearch, Valkey, Firestore DB, GCS bucket',
}

export function AdminTenantCreatePage() {
  const navigate = useNavigate()
  const [slug, setSlug] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [tier, setTier] = useState<Exclude<TenantTier, 'FREE'>>('STANDARD')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const normalizedSlug = slug.trim().toLowerCase()
    if (!SLUG_RE.test(normalizedSlug)) {
      setError('Slug must be lowercase letters, numbers, and hyphens only.')
      return
    }
    if (normalizedSlug === 'free') {
      setError('The free slug is reserved for the shared pool.')
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <span className="text-xs text-slate-500">
            Host: {slug.trim() ? `${slug.trim().toLowerCase()}.k8s.tbd-htwg.de` : '…'}
          </span>
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
          {(['STANDARD', 'PREMIUM'] as const).map((t) => (
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
                <span className="font-medium text-slate-900">{t}</span>
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
          disabled={submitting}
          className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create and provision'}
        </button>
      </form>
    </div>
  )
}
