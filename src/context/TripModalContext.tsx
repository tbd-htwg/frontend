import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type TripModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; tripId: number }

/** Base trip fields saved from the edit modal; consumed by TripDetailPage for live UI updates. */
export type TripBaseUpdate = {
  tripId: number
  title: string
  destination: string
  startDate: string
  shortDescription: string
  longDescription: string
}

type TripModalContextValue = {
  state: TripModalState
  openCreateTrip: () => void
  openEditTrip: (tripId: number) => void
  closeTripModal: () => void
  tripSaveRevision: number
  lastTripBaseUpdate: TripBaseUpdate | null
  publishTripBaseUpdate: (update: TripBaseUpdate) => void
}

const TripModalContext = createContext<TripModalContextValue | null>(null)

export function TripModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TripModalState>({ mode: 'closed' })
  const [tripSaveRevision, setTripSaveRevision] = useState(0)
  const [lastTripBaseUpdate, setLastTripBaseUpdate] = useState<TripBaseUpdate | null>(null)

  const openCreateTrip = useCallback(() => setState({ mode: 'create' }), [])
  const openEditTrip = useCallback((tripId: number) => setState({ mode: 'edit', tripId }), [])
  const closeTripModal = useCallback(() => setState({ mode: 'closed' }), [])

  const publishTripBaseUpdate = useCallback((update: TripBaseUpdate) => {
    setLastTripBaseUpdate(update)
    setTripSaveRevision((r) => r + 1)
  }, [])

  const value = useMemo(
    () => ({
      state,
      openCreateTrip,
      openEditTrip,
      closeTripModal,
      tripSaveRevision,
      lastTripBaseUpdate,
      publishTripBaseUpdate,
    }),
    [
      state,
      openCreateTrip,
      openEditTrip,
      closeTripModal,
      tripSaveRevision,
      lastTripBaseUpdate,
      publishTripBaseUpdate,
    ],
  )

  return <TripModalContext.Provider value={value}>{children}</TripModalContext.Provider>
}

export function useTripModal() {
  const ctx = useContext(TripModalContext)
  if (!ctx) {
    throw new Error('useTripModal must be used within TripModalProvider')
  }
  return ctx
}
