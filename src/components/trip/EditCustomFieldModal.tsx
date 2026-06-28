import { useEffect, useState } from 'react'
import { upsertTripCustomFields } from '../../api/customFields'
import { ApiError } from '../../api/client'
import {
  normalizeCustomFieldValue,
  sanitizeNumberInput,
  validateCustomFieldValue,
} from '../../lib/customFieldValidation'
import type { TripCustomFieldValue } from '../../types/customField'
import { CUSTOM_FIELD_TYPE_LABELS } from '../../types/customField'
import { Modal } from '../Modal'

export type EditCustomFieldModalProps = {
  tripId: number
  field: TripCustomFieldValue | null
  allFields: TripCustomFieldValue[]
  onClose: () => void
  onSaved: (updated: TripCustomFieldValue[]) => void
}

function fieldInput(
  field: TripCustomFieldValue,
  value: string,
  onChange: (next: string) => void,
) {
  const common =
    'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900'
  switch (field.type) {
    case 'TEXT_LONG':
      return (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={field.name}
          className={common}
        />
      )
    case 'URL':
      return (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={field.name}
          className={common}
          placeholder="https://"
        />
      )
    case 'NUMBER':
      return (
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(sanitizeNumberInput(e.target.value))}
          aria-label={field.name}
          className={common}
          placeholder="0"
        />
      )
    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={field.name}
          className={common}
        />
      )
  }
}

export function EditCustomFieldModal({
  tripId,
  field,
  allFields,
  onClose,
  onSaved,
}: EditCustomFieldModalProps) {
  const open = field !== null
  const [value, setValue] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!field) return
    setValue(field.value ?? '')
    setFieldError(null)
    setError(null)
  }, [field])

  async function handleSave() {
    if (!field) return
    setFieldError(null)
    setError(null)
    const normalized = normalizeCustomFieldValue(field.type, value)
    const validationMessage = validateCustomFieldValue(field.type, normalized)
    if (validationMessage) {
      setFieldError(validationMessage)
      return
    }

    setSaving(true)
    try {
      const payload = allFields.map((f) => ({
        fieldId: f.fieldId,
        value:
          f.fieldId === field.fieldId
            ? normalized
            : normalizeCustomFieldValue(f.type, f.value ?? ''),
      }))
      const updated = await upsertTripCustomFields(tripId, payload)
      onSaved(updated)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.body) {
        try {
          const parsed = JSON.parse(err.body) as { message?: string }
          if (parsed.message) {
            setError(parsed.message)
            return
          }
        } catch {
          /* use raw body below */
        }
        setError(err.body)
      } else {
        setError(err instanceof Error ? err.message : 'Could not save custom field')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open || !field) return null

  return (
    <Modal open={open} title={`Edit custom field — ${field.name}`} onClose={onClose} maxWidth="lg">
      <p className="text-sm text-slate-600">
        Type: {CUSTOM_FIELD_TYPE_LABELS[field.type]}
      </p>
      <div className="mt-4 space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor={`cf-${field.fieldId}`}>
          Value
        </label>
        <div id={`cf-${field.fieldId}`}>{fieldInput(field, value, setValue)}</div>
        {fieldError && (
          <p className="text-xs text-red-700" role="alert">
            {fieldError}
          </p>
        )}
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </Modal>
  )
}
