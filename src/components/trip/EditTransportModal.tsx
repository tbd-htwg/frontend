import { useEffect, useState } from 'react'
import { updateTransport } from '../../api/transports'
import { usePlaceSearch } from '../../hooks/usePlaceSearch'
import type { PlaceSuggestion, TransportResponse } from '../../types/api'
import { placeSearchErrorFromUnknown } from '../../utils/placeSearchErrors'
import { transportRouteLabel } from '../../utils/transportRoute'
import { transportWithPlaceCoords } from '../../utils/transportGeo'
import { Modal } from '../Modal'
import { PlaceSearchDropdown } from '../PlaceSearchDropdown'

function placeFromAddress(
  placeId: string | undefined,
  placeName: string | undefined,
  formattedAddress: string | undefined,
): PlaceSuggestion | null {
  if (!placeId) return null
  return {
    placeId,
    placeName: placeName ?? formattedAddress ?? '',
    formattedAddress: formattedAddress ?? '',
    lat: 0,
    lon: 0,
  }
}

export type EditTransportModalProps = {
  entry: TransportResponse | null
  onClose: () => void
  onSaved: (updated: TransportResponse) => void
}

export function EditTransportModal({ entry, onClose, onSaved }: EditTransportModalProps) {
  const open = entry !== null
  const [startPlaceSearch, setStartPlaceSearch] = useState('')
  const [endPlaceSearch, setEndPlaceSearch] = useState('')
  const [showStartSuggestions, setShowStartSuggestions] = useState(false)
  const [showEndSuggestions, setShowEndSuggestions] = useState(false)
  const [selectedStartPlace, setSelectedStartPlace] = useState<PlaceSuggestion | null>(null)
  const [selectedEndPlace, setSelectedEndPlace] = useState<PlaceSuggestion | null>(null)
  const [saving, setSaving] = useState(false)

  const startPlaceSearchState = usePlaceSearch(startPlaceSearch, showStartSuggestions)
  const endPlaceSearchState = usePlaceSearch(endPlaceSearch, showEndSuggestions)

  useEffect(() => {
    if (!entry) return
    setStartPlaceSearch(entry.startAddress ?? '')
    setEndPlaceSearch(entry.endAddress ?? '')
    setSelectedStartPlace(
      placeFromAddress(entry.startGooglePlaceId, entry.startAddress, entry.startAddress),
    )
    setSelectedEndPlace(placeFromAddress(entry.endGooglePlaceId, entry.endAddress, entry.endAddress))
    setShowStartSuggestions(false)
    setShowEndSuggestions(false)
  }, [entry])

  async function handleSave() {
    if (!entry) return
    const startId = selectedStartPlace?.placeId ?? entry.startGooglePlaceId
    const endId = selectedEndPlace?.placeId ?? entry.endGooglePlaceId
    if (!startId || !endId) {
      alert('Pick start and end places from Google search suggestions.')
      return
    }

    setSaving(true)
    try {
      const updated = await updateTransport(entry.id, {
        startGooglePlaceId: startId,
        endGooglePlaceId: endId,
      })
      const start = selectedStartPlace ?? placeFromAddress(startId, entry.startAddress, entry.startAddress)
      const end = selectedEndPlace ?? placeFromAddress(endId, entry.endAddress, entry.endAddress)
      if (start && end && start.lat !== 0 && end.lat !== 0) {
        onSaved(transportWithPlaceCoords(updated, start, end))
      } else {
        onSaved({
          ...updated,
          startLatitude: entry.startLatitude,
          startLongitude: entry.startLongitude,
          endLatitude: entry.endLatitude,
          endLongitude: entry.endLongitude,
        })
      }
      onClose()
    } catch (err) {
      alert(placeSearchErrorFromUnknown(err).message)
    } finally {
      setSaving(false)
    }
  }

  if (!open || !entry) return null

  const canSave =
    (selectedStartPlace?.placeId ?? entry.startGooglePlaceId) &&
    (selectedEndPlace?.placeId ?? entry.endGooglePlaceId)

  return (
    <Modal open={open} title={`Edit transport — ${transportRouteLabel(entry)}`} onClose={onClose} maxWidth="lg">
      <p className="text-sm text-slate-600">
        Search again to change the start or end place for this route.
      </p>
      <div className="mt-4 space-y-3">
        <div className="relative">
          <input
            placeholder="Start (search place)"
            value={startPlaceSearch}
            onFocus={() => setShowStartSuggestions(true)}
            onBlur={() => setTimeout(() => setShowStartSuggestions(false), 150)}
            onChange={(e) => {
              setStartPlaceSearch(e.target.value)
              setSelectedStartPlace(null)
              setShowStartSuggestions(true)
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <PlaceSearchDropdown
            open={showStartSuggestions}
            query={startPlaceSearch}
            suggestions={startPlaceSearchState.suggestions}
            searchError={startPlaceSearchState.searchError}
            searching={startPlaceSearchState.searching}
            listboxLabel="Start place search results"
            onSelect={(hit) => {
              setSelectedStartPlace(hit)
              setStartPlaceSearch(hit.placeName)
              setShowStartSuggestions(false)
            }}
          />
        </div>
        <div className="relative">
          <input
            placeholder="End (search place)"
            value={endPlaceSearch}
            onFocus={() => setShowEndSuggestions(true)}
            onBlur={() => setTimeout(() => setShowEndSuggestions(false), 150)}
            onChange={(e) => {
              setEndPlaceSearch(e.target.value)
              setSelectedEndPlace(null)
              setShowEndSuggestions(true)
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <PlaceSearchDropdown
            open={showEndSuggestions}
            query={endPlaceSearch}
            suggestions={endPlaceSearchState.suggestions}
            searchError={endPlaceSearchState.searchError}
            searching={endPlaceSearchState.searching}
            listboxLabel="End place search results"
            onSelect={(hit) => {
              setSelectedEndPlace(hit)
              setEndPlaceSearch(hit.placeName)
              setShowEndSuggestions(false)
            }}
          />
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
