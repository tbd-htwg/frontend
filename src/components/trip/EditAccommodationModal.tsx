import { useEffect, useState } from 'react'
import { updateAccommodation } from '../../api/accommodations'
import { usePlaceSearch } from '../../hooks/usePlaceSearch'
import type { AccommodationResponse, PlaceSuggestion } from '../../types/api'
import { placeSearchErrorFromUnknown } from '../../utils/placeSearchErrors'
import { CURRENCY_OPTIONS } from '../../constants/currencies'
import { Modal } from '../Modal'
import { PlaceSearchDropdown } from '../PlaceSearchDropdown'

function isoToDateInput(iso?: string): string {
  if (!iso) return ''
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso)
  return m?.[1] ?? iso.slice(0, 10)
}

function placeFromEntry(entry: AccommodationResponse): PlaceSuggestion | null {
  if (!entry.googlePlaceId) return null
  return {
    placeId: entry.googlePlaceId,
    placeName: entry.name,
    formattedAddress: entry.address,
    lat: 0,
    lon: 0,
  }
}

export type EditAccommodationModalProps = {
  entry: AccommodationResponse | null
  onClose: () => void
  onSaved: (updated: AccommodationResponse) => void
}

export function EditAccommodationModal({ entry, onClose, onSaved }: EditAccommodationModalProps) {
  const open = entry !== null
  const [placeSearch, setPlaceSearch] = useState('')
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null)
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [cost, setCost] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [saving, setSaving] = useState(false)

  const placeSearchState = usePlaceSearch(placeSearch, showPlaceSuggestions)

  useEffect(() => {
    if (!entry) return
    setPlaceSearch(entry.name)
    setSelectedPlace(placeFromEntry(entry))
    setCheckInDate(isoToDateInput(entry.checkInDate))
    setCheckOutDate(isoToDateInput(entry.checkOutDate))
    setCost(entry.cost != null ? String(entry.cost) : '')
    setCurrency(entry.currency?.trim() || 'EUR')
    setShowPlaceSuggestions(false)
  }, [entry])

  async function handleSave() {
    if (!entry) return
    const placeId = selectedPlace?.placeId ?? entry.googlePlaceId
    if (!placeId) {
      alert('Pick a place from Google search suggestions.')
      return
    }
    if (!checkInDate || !checkOutDate) {
      alert('Check-in and check-out dates are required.')
      return
    }
    if (checkOutDate < checkInDate) {
      alert('Check-out must be on or after check-in.')
      return
    }
    const parsedCost = Number.parseFloat(cost)
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      alert('Enter a valid cost.')
      return
    }

    setSaving(true)
    try {
      const updated = await updateAccommodation(entry.id, {
        googlePlaceId: placeId,
        checkInDate,
        checkOutDate,
        cost: parsedCost,
        currency,
      })
      onSaved(updated)
      onClose()
    } catch (err) {
      alert(placeSearchErrorFromUnknown(err).message)
    } finally {
      setSaving(false)
    }
  }

  if (!open || !entry) return null

  const canSave =
    (selectedPlace?.placeId ?? entry.googlePlaceId) &&
    checkInDate &&
    checkOutDate &&
    cost.trim() &&
    Number.parseFloat(cost) >= 0 &&
    currency

  return (
    <Modal open={open} title={`Edit accommodation — ${entry.name}`} onClose={onClose} maxWidth="lg">
      <p className="text-sm text-slate-600">
        Update the property, stay dates, and cost. Search again to change the place.
      </p>
      <div className="mt-4 space-y-3">
        <div className="relative">
          <input
            placeholder="Search property (Google)"
            value={placeSearch}
            onFocus={() => setShowPlaceSuggestions(true)}
            onBlur={() => setTimeout(() => setShowPlaceSuggestions(false), 150)}
            onChange={(e) => {
              setPlaceSearch(e.target.value)
              setSelectedPlace(null)
              setShowPlaceSuggestions(true)
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <PlaceSearchDropdown
            open={showPlaceSuggestions}
            query={placeSearch}
            suggestions={placeSearchState.suggestions}
            searchError={placeSearchState.searchError}
            searching={placeSearchState.searching}
            onSelect={(hit) => {
              setSelectedPlace(hit)
              setPlaceSearch(hit.placeName)
              setShowPlaceSuggestions(false)
            }}
          />
        </div>
        {selectedPlace ? (
          <p className="text-xs text-slate-600">{selectedPlace.formattedAddress}</p>
        ) : entry.googlePlaceId ? (
          <p className="text-xs text-slate-500">Current place is kept until you pick a new suggestion.</p>
        ) : (
          <p className="text-xs text-slate-500">Pick a suggestion so we can store the Google place id.</p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-slate-700">
            Check-in
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-700">
            Check-out
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-slate-700">
            Cost
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-700">
            Currency
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
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
            disabled={saving || !canSave}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
