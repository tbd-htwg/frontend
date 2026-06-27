import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons'
import { listTripCustomFields, upsertTripCustomFields } from '../../api/customFields'
import { ApiError } from '../../api/client'
import type { CustomFieldType, TripCustomFieldValue } from '../../types/customField'
import { normalizeCustomFieldValue } from '../../lib/customFieldValidation'
import { TripSectionHeader } from '../TripSectionHeader'
import { EditCustomFieldModal } from './EditCustomFieldModal'

type TripCustomFieldsSectionProps = {
  tripId: number
  isOwner: boolean
  showTripManagement: boolean
}

function renderReadOnlyValue(type: CustomFieldType, value: string) {
  if (!value) {
    return <span className="text-slate-500">—</span>
  }
  if (type === 'URL') {
    return (
      <a href={value} className="break-all text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer">
        {value}
      </a>
    )
  }
  if (type === 'TEXT_LONG') {
    return <p className="whitespace-pre-wrap break-words text-slate-800">{value}</p>
  }
  return <span className="break-words text-slate-800">{value}</span>
}

export function TripCustomFieldsSection({
  tripId,
  isOwner,
  showTripManagement,
}: TripCustomFieldsSectionProps) {
  const [fields, setFields] = useState<TripCustomFieldValue[]>([])
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<TripCustomFieldValue | null>(null)
  const [removingFieldId, setRemovingFieldId] = useState<string | null>(null)

  const managing = isOwner && showTripManagement

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listTripCustomFields(tripId)
      .then((items) => {
        if (cancelled) return
        setFields(items)
        setAvailable(items.length > 0)
        setLoadError(null)
      })
      .catch((err) => {
        if (!cancelled) {
          setAvailable(false)
          setFields([])
          setLoadError(
            err instanceof ApiError
              ? err.body || `Could not load custom fields (${err.status})`
              : err instanceof Error
                ? err.message
                : 'Could not load custom fields',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tripId])

  async function handleRemove(field: TripCustomFieldValue) {
    if (!managing || !(field.value ?? '').trim()) return
    if (!window.confirm(`Remove the value for "${field.name}"?`)) return

    setRemovingFieldId(field.fieldId)
    try {
      const payload = fields.map((f) => ({
        fieldId: f.fieldId,
        value:
          f.fieldId === field.fieldId
            ? ''
            : normalizeCustomFieldValue(f.type, f.value ?? ''),
      }))
      const updated = await upsertTripCustomFields(tripId, payload)
      setFields(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove custom field value.')
    } finally {
      setRemovingFieldId(null)
    }
  }

  if (loading) {
    return null
  }

  if (loadError) {
    return (
      <>
        <hr className="my-8 w-full border-0 border-t border-slate-300" aria-hidden="true" />
        <section>
          <TripSectionHeader title="Custom fields" count={0} addAriaLabel="Custom fields" />
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
            {loadError}
          </p>
        </section>
      </>
    )
  }

  if (!available) {
    return null
  }

  const visibleFields = managing
    ? fields
    : fields.filter((f) => (f.value ?? '').trim().length > 0)

  if (visibleFields.length === 0) {
    return (
      <>
        <hr className="my-8 w-full border-0 border-t border-slate-300" aria-hidden="true" />
        <section>
          <TripSectionHeader title="Custom fields" count={fields.length} addAriaLabel="Custom fields" />
          <p className="mt-3 text-sm text-slate-600">No custom field values set yet.</p>
        </section>
      </>
    )
  }

  return (
    <>
      <hr className="my-8 w-full border-0 border-t border-slate-300" aria-hidden="true" />
      <section>
        <TripSectionHeader title="Custom fields" count={fields.length} addAriaLabel="Custom fields" />
        <ul className="mt-3 space-y-3">
          {visibleFields.map((field) => {
            const removing = removingFieldId === field.fieldId
            const hasValue = Boolean((field.value ?? '').trim())
            return (
              <li
                key={field.fieldId}
                className="rounded-md border border-slate-300 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{field.name}</p>
                    <div className="mt-1 text-sm">
                      {renderReadOnlyValue(field.type, field.value ?? '')}
                    </div>
                  </div>
                  {managing && (
                    <div className="flex shrink-0 flex-wrap items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingField(field)}
                        disabled={removing || editingField?.fieldId === field.fieldId}
                        aria-label={`Edit custom field ${field.name}`}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRemove(field)}
                        disabled={removing || !hasValue || editingField?.fieldId === field.fieldId}
                        aria-label={
                          removing
                            ? `Removing value for ${field.name}`
                            : `Remove value for ${field.name}`
                        }
                        className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                        {removing ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <EditCustomFieldModal
        tripId={tripId}
        field={editingField}
        allFields={fields}
        onClose={() => setEditingField(null)}
        onSaved={setFields}
      />
    </>
  )
}
