import { useEffect, useState } from 'react'

import { getTrip } from '../api/trips'
import { ApiError } from '../api/client'
import { loadSlice, sliceErrorMessage } from '../api/loadSlice'
import type {
  AccommodationResponse,
  TransportResponse,
  TripDetailsResponse,
  TripLocationResponse,
} from '../types/api'

export type SliceStatus = 'idle' | 'loading' | 'success' | 'error'

export function useTripDetailCore(tripId: number) {
  const [trip, setTrip] = useState<TripDetailsResponse | null>(null)
  const [tripLocations, setTripLocations] = useState<TripLocationResponse[]>([])
  const [tripTransports, setTripTransports] = useState<TransportResponse[]>([])
  const [tripAccommodations, setTripAccommodations] = useState<AccommodationResponse[]>([])
  const [status, setStatus] = useState<SliceStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const tripIdValid = Number.isFinite(tripId)

  useEffect(() => {
    if (!tripIdValid) {
      setStatus('error')
      setError('Invalid trip id.')
      setTrip(null)
      setTripLocations([])
      setTripTransports([])
      setTripAccommodations([])
      return
    }

    let cancelled = false
    setStatus('loading')
    setError(null)

    void (async () => {
      const result = await loadSlice(() => getTrip(tripId))
      if (cancelled) return

      if (result.ok) {
        const t = result.data
        setTrip(t)
        setTripLocations(t.tripLocations ?? [])
        setTripTransports(t.transports ?? [])
        setTripAccommodations(t.accommodations ?? [])
        setStatus('success')
        setError(null)
      } else {
        setTrip(null)
        setTripLocations([])
        setTripTransports([])
        setTripAccommodations([])
        setStatus('error')
        setError(
          result.error instanceof ApiError
            ? result.error.message
            : sliceErrorMessage(result.error, 'Could not load this trip.'),
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tripId, tripIdValid])

  return {
    trip,
    setTrip,
    tripLocations,
    setTripLocations,
    tripTransports,
    setTripTransports,
    tripAccommodations,
    setTripAccommodations,
    status,
    error,
    tripIdValid,
    tripLoading: status === 'loading',
    tripReady: status === 'success' && trip != null,
  }
}
