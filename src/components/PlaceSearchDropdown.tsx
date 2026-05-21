import type { PlaceSuggestion } from '../types/api'
import {
  placeSearchErrorPanelClass,
  type PlaceSearchError,
} from '../utils/placeSearchErrors'
import { modalDropdownClassName } from './Modal'

export type PlaceSearchDropdownProps = {
  open: boolean
  query: string
  suggestions: PlaceSuggestion[]
  searchError: PlaceSearchError | null
  searching: boolean
  minQueryLen?: number
  listboxLabel?: string
  onSelect: (hit: PlaceSuggestion) => void
}

export function PlaceSearchDropdown({
  open,
  query,
  suggestions,
  searchError,
  searching,
  minQueryLen = 2,
  listboxLabel = 'Place search results',
  onSelect,
}: PlaceSearchDropdownProps) {
  if (!open) return null

  const trimmed = query.trim()
  const showPanel = trimmed.length >= minQueryLen

  if (!showPanel) return null

  if (searching && suggestions.length === 0 && !searchError) {
    return (
      <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Searching places…
      </p>
    )
  }

  if (searchError) {
    return (
      <p
        role="alert"
        className={`mt-1 rounded-md border px-3 py-2 text-xs ${placeSearchErrorPanelClass(searchError.kind)}`}
      >
        {searchError.message}
      </p>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <ul className={modalDropdownClassName} role="listbox" aria-label={listboxLabel}>
      {suggestions.map((hit) => (
        <li key={hit.placeId} role="option">
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(hit)}
          >
            <span className="font-medium text-slate-900">{hit.placeName}</span>
            <span className="mt-0.5 block text-xs text-slate-600">{hit.formattedAddress}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
