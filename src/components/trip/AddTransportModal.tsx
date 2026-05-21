import type { PlaceSuggestion } from '../../types/api'
import type { PlaceSearchError } from '../../utils/placeSearchErrors'
import { Modal } from '../Modal'
import { PlaceSearchDropdown } from '../PlaceSearchDropdown'

export type AddTransportModalProps = {
  open: boolean
  onClose: () => void
  startPlaceSearch: string
  setStartPlaceSearch: (v: string) => void
  endPlaceSearch: string
  setEndPlaceSearch: (v: string) => void
  showStartSuggestions: boolean
  setShowStartSuggestions: (v: boolean) => void
  showEndSuggestions: boolean
  setShowEndSuggestions: (v: boolean) => void
  startSuggestions: PlaceSuggestion[]
  endSuggestions: PlaceSuggestion[]
  startSearchError: PlaceSearchError | null
  endSearchError: PlaceSearchError | null
  startSearching: boolean
  endSearching: boolean
  selectedStartPlace: PlaceSuggestion | null
  setSelectedStartPlace: (p: PlaceSuggestion | null) => void
  selectedEndPlace: PlaceSuggestion | null
  setSelectedEndPlace: (p: PlaceSuggestion | null) => void
  savingTransport: boolean
  onAdd: () => void
}

export function AddTransportModal(props: AddTransportModalProps) {
  const p = props
  if (!p.open) return null

  const canAdd = p.selectedStartPlace && p.selectedEndPlace

  return (
    <Modal open={p.open} title="Add transport" onClose={p.onClose} maxWidth="lg">
      <p className="text-sm text-slate-600">
        Search start and end places on Google, then add this route to the trip.
      </p>
      <div className="mt-4 space-y-3">
        <div className="relative">
          <input
            placeholder="Start (search place)"
            value={p.startPlaceSearch}
            onFocus={() => p.setShowStartSuggestions(true)}
            onBlur={() => setTimeout(() => p.setShowStartSuggestions(false), 150)}
            onChange={(e) => {
              p.setStartPlaceSearch(e.target.value)
              p.setSelectedStartPlace(null)
              p.setShowStartSuggestions(true)
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <PlaceSearchDropdown
            open={p.showStartSuggestions}
            query={p.startPlaceSearch}
            suggestions={p.startSuggestions}
            searchError={p.startSearchError}
            searching={p.startSearching}
            listboxLabel="Start place search results"
            onSelect={(hit) => {
              p.setSelectedStartPlace(hit)
              p.setStartPlaceSearch(hit.placeName)
              p.setShowStartSuggestions(false)
            }}
          />
        </div>
        <div className="relative">
          <input
            placeholder="End (search place)"
            value={p.endPlaceSearch}
            onFocus={() => p.setShowEndSuggestions(true)}
            onBlur={() => setTimeout(() => p.setShowEndSuggestions(false), 150)}
            onChange={(e) => {
              p.setEndPlaceSearch(e.target.value)
              p.setSelectedEndPlace(null)
              p.setShowEndSuggestions(true)
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <PlaceSearchDropdown
            open={p.showEndSuggestions}
            query={p.endPlaceSearch}
            suggestions={p.endSuggestions}
            searchError={p.endSearchError}
            searching={p.endSearching}
            listboxLabel="End place search results"
            onSelect={(hit) => {
              p.setSelectedEndPlace(hit)
              p.setEndPlaceSearch(hit.placeName)
              p.setShowEndSuggestions(false)
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => void p.onAdd()}
          disabled={p.savingTransport || !canAdd}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {p.savingTransport ? 'Saving…' : 'Add'}
        </button>
      </div>
    </Modal>
  )
}
