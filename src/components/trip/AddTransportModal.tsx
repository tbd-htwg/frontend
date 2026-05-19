import type { TransportResponse } from '../../types/api'
import { Modal, modalDropdownClassName } from '../Modal'

export type AddTransportModalProps = {
  open: boolean
  onClose: () => void
  transportMode: 'existing' | 'new'
  setTransportMode: (fn: (prev: 'existing' | 'new') => 'existing' | 'new') => void
  transportSearch: string
  setTransportSearch: (v: string) => void
  showTransportSuggestions: boolean
  setShowTransportSuggestions: (v: boolean) => void
  transportSuggestions: TransportResponse[]
  selectedExistingTransport: TransportResponse | null
  setSelectedExistingTransport: (t: TransportResponse | null) => void
  savingTransport: boolean
  onAddExisting: () => void
  newTransportType: string
  setNewTransportType: (v: string) => void
  onCreateAndAdd: () => void
}

export function AddTransportModal(props: AddTransportModalProps) {
  const p = props
  if (!p.open) return null

  return (
    <Modal open={p.open} title="Add transport" onClose={p.onClose} maxWidth="lg">
      <p className="text-sm text-slate-600">Choose an existing transport type or create a new one.</p>
      <div className="my-4 flex justify-center">
        <button
          type="button"
          onClick={() => p.setTransportMode((prev) => (prev === 'existing' ? 'new' : 'existing'))}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {p.transportMode === 'existing'
            ? 'Switch to create new transport'
            : 'Switch to add existing transport'}
        </button>
      </div>
      {p.transportMode === 'existing' ? (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <input
                placeholder="Search transport"
                value={p.transportSearch}
                onFocus={() => p.setShowTransportSuggestions(true)}
                onBlur={() => setTimeout(() => p.setShowTransportSuggestions(false), 100)}
                onChange={(e) => {
                  p.setTransportSearch(e.target.value)
                  p.setShowTransportSuggestions(true)
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              {p.showTransportSuggestions && p.transportSuggestions.length > 0 && (
                <ul className={modalDropdownClassName} role="listbox" aria-label="Transport search results">
                  {p.transportSuggestions.map((item) => (
                    <li key={item.id} role="option">
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                        onMouseDown={() => {
                          p.setSelectedExistingTransport(item)
                          p.setTransportSearch(item.type)
                          p.setShowTransportSuggestions(false)
                        }}
                      >
                        {item.type}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => void p.onAddExisting()}
              disabled={p.savingTransport || !p.selectedExistingTransport}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {p.savingTransport ? 'Adding…' : 'Add'}
            </button>
          </div>
          {p.transportSearch.trim() &&
            !p.selectedExistingTransport &&
            p.transportSuggestions.length === 0 && (
              <p className="text-xs text-slate-600">
                No matching existing transport. Use “Create new transport”.
              </p>
            )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              placeholder="Transport type"
              value={p.newTransportType}
              onChange={(e) => p.setNewTransportType(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void p.onCreateAndAdd()}
              disabled={p.savingTransport || !p.newTransportType.trim()}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {p.savingTransport ? 'Saving…' : 'Create and add'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
