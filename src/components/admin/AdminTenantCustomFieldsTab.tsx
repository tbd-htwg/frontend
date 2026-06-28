import { useEffect, useMemo, useState } from 'react'
import {
  archiveAdminCustomField,
  createAdminCustomField,
  listAdminCustomFields,
} from '../../api/customFields'
import type { CustomFieldDeclaration } from '../../types/customField'
import { CUSTOM_FIELD_TYPE_LABELS } from '../../types/customField'
import { CustomFieldCreateModal } from './CustomFieldCreateModal'

type AdminTenantCustomFieldsTabProps = {
  tenantSlug: string
  tenantId: string
}

export function AdminTenantCustomFieldsTab({ tenantSlug, tenantId }: AdminTenantCustomFieldsTabProps) {
  const [fields, setFields] = useState<CustomFieldDeclaration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setFields(await listAdminCustomFields(tenantSlug, tenantId))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load custom fields')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [tenantSlug, tenantId])

  const visibleFields = useMemo(
    () => fields.filter((f) => showArchived || !f.archived),
    [fields, showArchived],
  )

  async function handleArchive(field: CustomFieldDeclaration) {
    setActionId(field.id)
    setError(null)
    try {
      const updated = await archiveAdminCustomField(tenantSlug, field.id, !field.archived, tenantId)
      setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Define extra fields for trips in this tenant (justification, total price, contact URL, …).
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          New custom field
        </button>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="rounded border-slate-300"
        />
        Show archived fields
      </label>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Loading custom fields…</p>
      ) : visibleFields.length === 0 ? (
        <p className="text-sm text-slate-600">No custom fields yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleFields.map((field) => (
                <tr key={field.id}>
                  <td className="px-4 py-3 font-mono text-slate-800">{field.id}</td>
                  <td className="px-4 py-3 text-slate-800">{field.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {CUSTOM_FIELD_TYPE_LABELS[field.type] ?? field.type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        field.archived
                          ? 'rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600'
                          : 'rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-800'
                      }
                    >
                      {field.archived ? 'Archived' : 'Visible'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {field.createdAt ? new Date(field.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={actionId === field.id}
                      onClick={() => void handleArchive(field)}
                      className="text-sm font-medium text-slate-700 hover:underline disabled:opacity-50"
                    >
                      {actionId === field.id
                        ? 'Saving…'
                        : field.archived
                          ? 'Restore'
                          : 'Archive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomFieldCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (payload) => {
          const created = await createAdminCustomField(tenantSlug, payload, tenantId)
          setFields((prev) => [...prev, created].sort((a, b) => a.id.localeCompare(b.id)))
        }}
      />
    </div>
  )
}
