import type { PlaceSuggestion } from '../../types/api'
import type { PlaceSearchError } from '../../utils/placeSearchErrors'
import { CURRENCY_OPTIONS } from '../../constants/currencies'
import { Modal } from '../Modal'
import { PlaceSearchDropdown } from '../PlaceSearchDropdown'

export type AddAccommodationModalProps = {
  open: boolean
  onClose: () => void
  placeSearch: string
  setPlaceSearch: (v: string) => void
  showPlaceSuggestions: boolean
  setShowPlaceSuggestions: (v: boolean) => void
  placeSuggestions: PlaceSuggestion[]
  placeSearchError: PlaceSearchError | null
  placeSearching: boolean
  selectedPlace: PlaceSuggestion | null
  setSelectedPlace: (p: PlaceSuggestion | null) => void
  checkInDate: string
  setCheckInDate: (v: string) => void
  checkOutDate: string
  setCheckOutDate: (v: string) => void
  cost: string
  setCost: (v: string) => void
  currency: string
  setCurrency: (v: string) => void
  savingAccommodation: boolean
  onAdd: () => void
}

export function AddAccommodationModal(props: AddAccommodationModalProps) {
  const p = props
  if (!p.open) return null

  const canAdd =
    p.selectedPlace &&
    p.checkInDate &&
    p.checkOutDate &&
    p.cost.trim() &&
    Number.parseFloat(p.cost) >= 0 &&
    p.currency

  return (
    <Modal open={p.open} title="Add accommodation" onClose={p.onClose} maxWidth="lg">
      <p className="text-sm text-slate-600">
        Search for a place on Google, then add stay details for this trip.
      </p>
      <div className="mt-4 space-y-3">
        <div className="relative">
          <input
            placeholder="Search property (Google)"
            value={p.placeSearch}
            onFocus={() => p.setShowPlaceSuggestions(true)}
            onBlur={() => setTimeout(() => p.setShowPlaceSuggestions(false), 150)}
            onChange={(e) => {
              p.setPlaceSearch(e.target.value)
              p.setSelectedPlace(null)
              p.setShowPlaceSuggestions(true)
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <PlaceSearchDropdown
            open={p.showPlaceSuggestions}
            query={p.placeSearch}
            suggestions={p.placeSuggestions}
            searchError={p.placeSearchError}
            searching={p.placeSearching}
            onSelect={(hit) => {
              p.setSelectedPlace(hit)
              p.setPlaceSearch(hit.placeName)
              p.setShowPlaceSuggestions(false)
            }}
          />
        </div>
        {p.selectedPlace ? (
          <p className="text-xs text-slate-600">{p.selectedPlace.formattedAddress}</p>
        ) : (
          <p className="text-xs text-slate-500">Pick a suggestion so we can store the Google place id.</p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-slate-700">
            Check-in
            <input
              type="date"
              value={p.checkInDate}
              onChange={(e) => p.setCheckInDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-700">
            Check-out
            <input
              type="date"
              value={p.checkOutDate}
              onChange={(e) => p.setCheckOutDate(e.target.value)}
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
              value={p.cost}
              onChange={(e) => p.setCost(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-700">
            Currency
            <select
              value={p.currency}
              onChange={(e) => p.setCurrency(e.target.value)}
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
        <button
          type="button"
          onClick={() => void p.onAdd()}
          disabled={p.savingAccommodation || !canAdd}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {p.savingAccommodation ? 'Saving…' : 'Add'}
        </button>
      </div>
    </Modal>
  )
}
