import { useEffect, useState } from 'react'
import { patchTripLocation } from '../../api/tripLocations'
import type { TripLocationResponse } from '../../types/api'
import { Modal } from '../Modal'

function isoToDateInput(iso?: string): string {
  if (!iso) return ''
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso)
  return m?.[1] ?? iso.slice(0, 10)
}

export type EditLocationVisitModalProps = {
  entry: TripLocationResponse | null
  onClose: () => void
  onSaved: (updated: TripLocationResponse) => void
}

export function EditLocationVisitModal({ entry, onClose, onSaved }: EditLocationVisitModalProps) {
  const open = entry !== null
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!entry) return
    setDescription(entry.description ?? '')
    setStartDate(isoToDateInput(entry.startDate))
    setEndDate(isoToDateInput(entry.endDate))
  }, [entry])

  async function handleSave() {
    if (!entry) return
    if (!startDate || !endDate) {
      alert('Start and end date are required.')
      return
    }
    if (endDate < startDate) {
      alert('End date must be on or after start date.')
      return
    }

    setSaving(true)
    try {
      const updated = await patchTripLocation(
        entry.id,
        {
          description: description.trim(),
          startDate: `${startDate}T00:00:00`,
          endDate: `${endDate}T23:59:59`,
        },
        entry.locationName,
      )
      onSaved(updated)
      onClose()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save visit details.')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !entry) return null

  const title = entry.locationName ? `Edit visit — ${entry.locationName}` : 'Edit visit'

  return (
    <Modal open={open} title={title} onClose={onClose} maxWidth="lg">
      <p className="text-sm text-slate-600">
        Visit on this trip (not the shared location record)
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700">Notes / description</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            aria-label="Notes and description for this visit"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-slate-700">Start date</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Visit start date"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">End date</p>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="Visit end date"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
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
      </div>
    </Modal>
  )
}
