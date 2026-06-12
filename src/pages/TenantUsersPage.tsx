import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listPublicTenantUsers, resolveTenantSlug } from '../api/tenantUsers'
import { getTenant } from '../api/tenants'
import { mockTenantStore } from '../mocks/mockTenantStore'
import { TenantUserRow } from '../components/admin/TenantUserRow'
import { isDemoMode } from '../demo/demoMode'
import { useMockTenantRefresh } from '../hooks/useMockTenantRefresh'
import type { TenantUser } from '../types/tenant'

export function TenantUsersPage() {
  const [searchParams] = useSearchParams()
  const slug = resolveTenantSlug(searchParams)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [notReady, setNotReady] = useState(false)
  const refreshTick = useMockTenantRefresh()

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    if (isDemoMode()) {
      const tenant = mockTenantStore.getTenantBySlug(slug)
      if (!tenant || tenant.status !== 'ACTIVE') {
        if (!cancelled) {
          setNotReady(true)
          setUsers([])
        }
      } else {
        listPublicTenantUsers(slug).then((data) => {
          if (!cancelled) {
            setUsers(data)
            setNotReady(false)
          }
        })
      }
      if (!cancelled) setLoading(false)
      return () => {
        cancelled = true
      }
    }

    listPublicTenantUsers(slug)
      .then((data) => {
        if (!cancelled) {
          setUsers(data)
          setNotReady(false)
        }
      })
      .catch(async () => {
        if (!cancelled) {
          const t = await getTenant(`tenant-${slug}`)
          setNotReady(!t || t.status !== 'ACTIVE')
          setUsers([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug, refreshTick])

  const title =
    slug === 'free' ? 'Community members' : `Users — ${slug}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Public directory for this tenant
          {isDemoMode() && slug !== 'free' && (
            <span className="text-slate-500"> (demo: ?tenant={slug})</span>
          )}
        </p>
      </div>

      {loading && <p className="text-sm text-slate-600">Loading…</p>}

      {!loading && notReady && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This tenant is not ready yet. User directory is available when status is Active.
        </div>
      )}

      {!loading && !notReady && (
        <ul className="space-y-2">
          {users.map((user) => (
            <TenantUserRow key={user.id} user={user} />
          ))}
        </ul>
      )}

      {!loading && !notReady && users.length === 0 && (
        <p className="text-sm text-slate-500">No users yet.</p>
      )}
    </div>
  )
}
