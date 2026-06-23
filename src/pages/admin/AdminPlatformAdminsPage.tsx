import { useEffect, useState, type FormEvent } from 'react'
import {
  addPlatformAdmin,
  listPlatformAdmins,
  removePlatformAdmin,
  type PlatformAdmin,
} from '../../api/platformAdmins'

export function AdminPlatformAdminsPage() {
  const [admins, setAdmins] = useState<PlatformAdmin[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setAdmins(await listPlatformAdmins())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load administrators')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await addPlatformAdmin(email.trim())
      setEmail('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add administrator')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(admin: PlatformAdmin) {
    if (!window.confirm(`Remove platform administrator ${admin.email}?`)) return
    setError(null)
    try {
      await removePlatformAdmin(admin.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove administrator')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform administrators</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create the user normally first, then add their email here. They receive admin access the
          next time they sign in.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <label className="min-w-64 flex-1 text-sm">
          <span className="block font-medium text-slate-700">User email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="user@example.com"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Promote to admin'}
        </button>
      </form>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Loading administrators…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{admin.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(admin.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void handleRemove(admin)}
                      className="text-sm font-medium text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
