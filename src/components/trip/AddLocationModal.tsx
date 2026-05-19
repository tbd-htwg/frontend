import type { GeocodingSuggestion, LocationResponse } from '../../types/api'
import { Modal, modalDropdownClassName } from '../Modal'

export type AddLocationModalProps = {
  open: boolean
  onClose: () => void
  locationMode: 'existing' | 'new'
  setLocationMode: (fn: (prev: 'existing' | 'new') => 'existing' | 'new') => void
  locationSearch: string
  setLocationSearch: (v: string) => void
  showLocationSuggestions: boolean
  setShowLocationSuggestions: (v: boolean) => void
  locationSuggestions: LocationResponse[]
  selectedExistingLocation: LocationResponse | null
  setSelectedExistingLocation: (l: LocationResponse | null) => void
  existingLocationDescription: string
  setExistingLocationDescription: (v: string) => void
  existingLocationStartDate: string
  setExistingLocationStartDate: (v: string) => void
  existingLocationEndDate: string
  setExistingLocationEndDate: (v: string) => void
  savingLocation: boolean
  onAddExisting: () => void
  newLocationName: string
  setNewLocationName: (v: string) => void
  showGeocodeSuggestions: boolean
  setShowGeocodeSuggestions: (v: boolean) => void
  geocodeSuggestions: GeocodingSuggestion[]
  selectedGeocode: GeocodingSuggestion | null
  setSelectedGeocode: (g: GeocodingSuggestion | null) => void
  newLocationDescription: string
  setNewLocationDescription: (v: string) => void
  newLocationStartDate: string
  setNewLocationStartDate: (v: string) => void
  newLocationEndDate: string
  setNewLocationEndDate: (v: string) => void
  onCreateAndAdd: () => void
}

export function AddLocationModal(props: AddLocationModalProps) {
  const p = props
  if (!p.open) return null

  return (
    <Modal open={p.open} title="Add location" onClose={p.onClose} maxWidth="2xl">
      <p className="text-sm text-slate-600">Choose an existing location or create a new one.</p>
      <div className="my-4 flex items-center justify-center">
        <button
          type="button"
          onClick={() => p.setLocationMode((prev) => (prev === 'existing' ? 'new' : 'existing'))}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {p.locationMode === 'existing' ? 'Switch to create new location' : 'Switch to add existing location'}
        </button>
      </div>
      {p.locationMode === 'existing' ? (
        <div className="space-y-2 overflow-visible">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Add existing location</p>
          <div className="grid gap-2 overflow-visible sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <input
                placeholder="Search cities"
                aria-label="Search existing cities"
                value={p.locationSearch}
                onFocus={() => p.setShowLocationSuggestions(true)}
                onBlur={() => setTimeout(() => p.setShowLocationSuggestions(false), 100)}
                onChange={(e) => {
                  p.setLocationSearch(e.target.value)
                  p.setShowLocationSuggestions(true)
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              {p.showLocationSuggestions && p.locationSuggestions.length > 0 && (
                <ul className={modalDropdownClassName} role="listbox" aria-label="Location search results">
                  {p.locationSuggestions.map((l) => (
                    <li key={l.id} role="option">
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                        onMouseDown={() => {
                          p.setSelectedExistingLocation(l)
                          p.setLocationSearch(l.city)
                          p.setShowLocationSuggestions(false)
                        }}
                      >
                        <span className="block font-medium text-slate-900">{l.city}</span>
                        {l.formattedAddress ? (
                          <span className="block text-xs text-slate-500">{l.formattedAddress}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => void p.onAddExisting()}
              disabled={
                p.savingLocation ||
                !p.selectedExistingLocation ||
                !p.existingLocationDescription.trim() ||
                !p.existingLocationStartDate ||
                !p.existingLocationEndDate
              }
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {p.savingLocation ? 'Adding…' : 'Add'}
            </button>
          </div>
          <textarea
            rows={2}
            placeholder="How was it there? Share a quick impression."
            value={p.existingLocationDescription}
            onChange={(e) => p.setExistingLocationDescription(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate-700">
              Start date
              <input type="date" value={p.existingLocationStartDate} onChange={(e) => p.setExistingLocationStartDate(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-slate-700">
              End date
              <input type="date" value={p.existingLocationEndDate} onChange={(e) => p.setExistingLocationEndDate(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </label>
          </div>
          {p.locationSearch.trim() && !p.selectedExistingLocation && p.locationSuggestions.length === 0 && (
            <p className="text-xs text-slate-600">No matching existing locations. Use “Create new location”.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2 overflow-visible">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Create and add new location</p>
          <div className="grid gap-2 overflow-visible sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <input
                placeholder="Search city (pick a suggestion)"
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
              {p.showGeocodeSuggestions && p.geocodeSuggestions.length > 0 && (
                <ul className={modalDropdownClassName} role="listbox" aria-label="City search results">
                  {p.geocodeSuggestions.map((hit, index) => (
                    <li key={`${hit.lat}-${hit.lon}-${index}`} role="option">
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          p.setSelectedGeocode(hit)
                          p.setNewLocationName(hit.city)
                          p.setShowGeocodeSuggestions(false)
                        }}
                      >
                        <span className="font-medium text-slate-900">{hit.city}</span>
                        <span className="mt-0.5 block text-xs text-slate-600">{hit.displayName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
              {p.savingLocation ? 'Saving…' : 'Create and add'}
            </button>
          </div>
          {p.selectedGeocode ? (
            <p className="text-xs text-slate-600">{p.selectedGeocode.displayName}</p>
          ) : (
            <p className="text-xs text-slate-500">Type a city name and choose a match from the suggestions.</p>
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
              <input type="date" value={p.newLocationStartDate} onChange={(e) => p.setNewLocationStartDate(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-slate-700">
              End date
              <input type="date" value={p.newLocationEndDate} onChange={(e) => p.setNewLocationEndDate(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </label>
          </div>
        </div>
      )}
    </Modal>
  )
}
