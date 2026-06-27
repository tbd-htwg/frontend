import { useEffect, useState, type FormEvent } from 'react'
import {
  CUSTOM_FIELD_TYPES,
  CUSTOM_FIELD_TYPE_LABELS,
  type CustomFieldType,
} from '../../types/customField'
import { slugifyFieldId } from '../../lib/slugifyFieldId'

type CustomFieldCreateModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { id: string; name: string; type: CustomFieldType }) => Promise<void>
}

export function CustomFieldCreateModal({ open, onClose, onSubmit }: CustomFieldCreateModalProps) {
  const [name, setName] = useState('')
  const [id, setId] = useState('')
  const [idTouched, setIdTouched] = useState(false)
  const [type, setType] = useState<CustomFieldType>('TEXT_SHORT')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setId('')
    setIdTouched(false)
    setType('TEXT_SHORT')
    setError(null)
  }, [open])

  useEffect(() => {
    if (!idTouched) {
      setId(slugifyFieldId(name))
    }
  }, [name, idTouched])

  if (!open) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ id: id.trim(), name: name.trim(), type })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create custom field')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-field-create-title"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg"
      >
        <h2 id="custom-field-create-title" className="text-lg font-semibold text-slate-900">
          New custom field
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Declarations apply to all trips in this tenant. Trip owners fill in values per trip.
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Justification"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">ID</span>
            <input
              required
              value={id}
              onChange={(e) => {
                setIdTouched(true)
                setId(e.target.value)
              }}
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder="justification"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Unique slug inferred from name; editable before save.
            </span>
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CustomFieldType)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            >
              {CUSTOM_FIELD_TYPES.map((option) => (
                <option key={option} value={option}>
                  {CUSTOM_FIELD_TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
