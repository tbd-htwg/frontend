import type { AccommodationResponse } from '../../types/api'
import { Modal, modalDropdownClassName } from '../Modal'

export type AddAccommodationModalProps = {
  open: boolean
  onClose: () => void
  accommodationMode: 'existing' | 'new'
  setAccommodationMode: (fn: (prev: 'existing' | 'new') => 'existing' | 'new') => void
  accommodationSearch: string
  setAccommodationSearch: (v: string) => void
  showAccommodationSuggestions: boolean
  setShowAccommodationSuggestions: (v: boolean) => void
  accommodationSuggestions: AccommodationResponse[]
  selectedExistingAccommodation: AccommodationResponse | null
  setSelectedExistingAccommodation: (a: AccommodationResponse | null) => void
  savingAccommodation: boolean
  onAddExisting: () => void
  newAccommodationName: string
  setNewAccommodationName: (v: string) => void
  newAccommodationType: string
  setNewAccommodationType: (v: string) => void
  newAccommodationAddress: string
  setNewAccommodationAddress: (v: string) => void
  onCreateAndAdd: () => void
}

export function AddAccommodationModal(props: AddAccommodationModalProps) {
  const p = props
  if (!p.open) return null

  return (
    <Modal open={p.open} title="Add accommodation" onClose={p.onClose} maxWidth="lg">
      <p className="text-sm text-slate-600">Choose an existing accommodation or create a new one.</p>
      <div className="my-4 flex justify-center">
        <button
          type="button"
          onClick={() => p.setAccommodationMode((prev) => (prev === 'existing' ? 'new' : 'existing'))}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {p.accommodationMode === 'existing'
            ? 'Switch to create new accommodation'
            : 'Switch to add existing accommodation'}
        </button>
      </div>
      {p.accommodationMode === 'existing' ? (
        <div className="space-y-2 overflow-visible">
          <div className="grid gap-2 overflow-visible sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <input
                placeholder="Search accommodation"
                aria-label="Search existing accommodations"
                value={p.accommodationSearch}
                onFocus={() => p.setShowAccommodationSuggestions(true)}
                onBlur={() => setTimeout(() => p.setShowAccommodationSuggestions(false), 100)}
                onChange={(e) => {
                  p.setAccommodationSearch(e.target.value)
                  p.setShowAccommodationSuggestions(true)
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              {p.showAccommodationSuggestions && p.accommodationSuggestions.length > 0 && (
                <ul className={modalDropdownClassName} role="listbox" aria-label="Accommodation search results">
                  {p.accommodationSuggestions.map((item) => (
                    <li key={item.id} role="option">
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                        onMouseDown={() => {
                          p.setSelectedExistingAccommodation(item)
                          p.setAccommodationSearch(`${item.name} (${item.type})`)
                          p.setShowAccommodationSuggestions(false)
                        }}
                      >
                        {item.name} ({item.type}) - {item.address}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => void p.onAddExisting()}
              disabled={p.savingAccommodation || !p.selectedExistingAccommodation}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {p.savingAccommodation ? 'Adding…' : 'Add'}
            </button>
          </div>
          {p.accommodationSearch.trim() &&
            !p.selectedExistingAccommodation &&
            p.accommodationSuggestions.length === 0 && (
              <p className="text-xs text-slate-600">
                No matching existing accommodation. Use “Create new accommodation”.
              </p>
            )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              placeholder="Accommodation name"
              value={p.newAccommodationName}
              onChange={(e) => p.setNewAccommodationName(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Type (hotel, hostel, ...)"
              value={p.newAccommodationType}
              onChange={(e) => p.setNewAccommodationType(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Address"
              value={p.newAccommodationAddress}
              onChange={(e) => p.setNewAccommodationAddress(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => void p.onCreateAndAdd()}
            disabled={
              p.savingAccommodation ||
              !p.newAccommodationName.trim() ||
              !p.newAccommodationType.trim() ||
              !p.newAccommodationAddress.trim()
            }
            className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {p.savingAccommodation ? 'Saving…' : 'Create and add'}
          </button>
        </div>
      )}
    </Modal>
  )
}
