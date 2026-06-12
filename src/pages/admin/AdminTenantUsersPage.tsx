import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTenant } from '../../api/tenants'
import {
  deleteAdminTenantUser,
  listAdminTenantUsers,
} from '../../api/tenantUsers'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { TenantUserRow } from '../../components/admin/TenantUserRow'
import { useMockTenantRefresh } from '../../hooks/useMockTenantRefresh'
import type { Tenant, TenantUser } from '../../types/tenant'

export function AdminTenantUsersPage() {
  const { id } = useParams<{ id: string }>()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const refreshTick = useMockTenantRefresh()

  const load = useCallback(async () => {
    if (!id) return
    const [t, u] = await Promise.all([getTenant(id), listAdminTenantUsers(id)])
    setTenant(t)
    setUsers(u)
  }, [id])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    load()
      .catch(() => {
        if (!cancelled) setTenant(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load, refreshTick])

  async function confirmDelete() {
    if (!id || deleteId == null) return
    await deleteAdminTenantUser(id, deleteId)
    setDeleteId(null)
    await load()
  }

  const deleteUser = users.find((u) => u.id === deleteId)

  if (loading) {
    return <p className="text-sm text-slate-600">Loading users…</p>
  }

  if (!tenant) {
    return (
      <p className="text-red-700" role="alert">
        Tenant not found
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/admin/tenants/${tenant.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to {tenant.displayName}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Tenant users</h1>
        <p className="mt-1 text-sm text-slate-600">
          Admin view — emails visible. Use trash icon to remove a user.
        </p>
      </div>

      <ul className="space-y-2">
        {users.map((user) => (
          <TenantUserRow
            key={user.id}
            user={user}
            showEmail
            showDelete
            onDelete={setDeleteId}
          />
        ))}
      </ul>

      {users.length === 0 && (
        <p className="text-sm text-slate-500">No users in this tenant yet.</p>
      )}

      <ConfirmDialog
        open={deleteId != null}
        title="Delete user"
        message={
          deleteUser
            ? `Remove "${deleteUser.name}" from this tenant? This cannot be undone in production.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
