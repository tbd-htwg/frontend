import type { PlaceSuggestion } from '../../types/api'
import type { PlaceSearchError } from '../../utils/placeSearchErrors'
import { Modal } from '../Modal'
import { PlaceSearchDropdown } from '../PlaceSearchDropdown'

export type AddLocationModalProps = {
  open: boolean
  onClose: () => void
  newLocationName: string
  setNewLocationName: (v: string) => void
  showGeocodeSuggestions: boolean
  setShowGeocodeSuggestions: (v: boolean) => void
  geocodeSuggestions: PlaceSuggestion[]
  geocodeSearchError: PlaceSearchError | null
  geocodeSearching: boolean
  selectedGeocode: PlaceSuggestion | null
  setSelectedGeocode: (g: PlaceSuggestion | null) => void
  newLocationDescription: string
  setNewLocationDescription: (v: string) => void
  newLocationStartDate: string
  setNewLocationStartDate: (v: string) => void
  newLocationEndDate: string
  setNewLocationEndDate: (v: string) => void
  savingLocation: boolean
  onCreateAndAdd: () => void
}

export function AddLocationModal(props: AddLocationModalProps) {
  const p = props
  if (!p.open) return null

  return (
    <Modal open={p.open} title="Add location" onClose={p.onClose} maxWidth="2xl">
      <p className="text-sm text-slate-600">
        Search for a place (Google), add visit dates, and an optional note.
      </p>
      <div className="mt-4 space-y-2 overflow-visible">
        <div className="grid gap-2 overflow-visible sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <input
              placeholder="Search place"
              aria-label="Search place"
              value={p.newLocationName}
              onFocus={() => p.setShowGeocodeSuggestions(true)}
              onBlur={() => setTimeout(() => p.setShowGeocodeSuggestions(false), 150)}
              onChange={(e) => {
                p.setNewLocationName(e.target.value)
                p.setSelectedGeocode(null)
                p.setShowGeocodeSuggestions(true)
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <PlaceSearchDropdown
              open={p.showGeocodeSuggestions}
              query={p.newLocationName}
              suggestions={p.geocodeSuggestions}
              searchError={p.geocodeSearchError}
              searching={p.geocodeSearching}
              onSelect={(hit) => {
                p.setSelectedGeocode(hit)
                p.setNewLocationName(hit.placeName)
                p.setShowGeocodeSuggestions(false)
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => void p.onCreateAndAdd()}
            disabled={
              p.savingLocation ||
              !p.selectedGeocode ||
              !p.newLocationDescription.trim() ||
              !p.newLocationStartDate ||
              !p.newLocationEndDate
            }
            className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {p.savingLocation ? 'Saving…' : 'Add'}
          </button>
        </div>
        {p.selectedGeocode ? (
          <p className="text-xs text-slate-600">{p.selectedGeocode.formattedAddress}</p>
        ) : (
          <p className="text-xs text-slate-500">Pick a suggestion so we can store the Google place id.</p>
        )}
        <textarea
          rows={2}
          placeholder="How was it there? Share a quick impression."
          value={p.newLocationDescription}
          onChange={(e) => p.setNewLocationDescription(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-slate-700">
            Start date
            <input
              type="date"
              value={p.newLocationStartDate}
              onChange={(e) => p.setNewLocationStartDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-700">
            End date
            <input
              type="date"
              value={p.newLocationEndDate}
              onChange={(e) => p.setNewLocationEndDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      </div>
    </Modal>
  )
}
