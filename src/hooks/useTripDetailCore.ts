import { useEffect, useState } from 'react'

import { fetchTripDetailLocationImages, getTrip } from '../api/trips'
import { ApiError } from '../api/client'
import { loadSlice, sliceErrorMessage } from '../api/loadSlice'
import type {
  AccommodationResponse,
  TransportResponse,
  TripDetailsResponse,
  TripLocationImageResponse,
  TripLocationResponse,
} from '../types/api'

export type SliceStatus = 'idle' | 'loading' | 'success' | 'error'

function mergeLocationImages(
  locations: TripLocationResponse[],
  imageMap: Record<number, TripLocationImageResponse[]>,
): TripLocationResponse[] {
  return locations.map((entry) => {
    const images = imageMap[entry.id]
    if (!images || images.length === 0) return entry
    return { ...entry, images }
  })
}

export function useTripDetailCore(tripId: number, authenticated = false) {
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

  // Trip detail is a public read (no Bearer) so signed image URLs are omitted inline; load them
  // in a second authenticated request, matching the feed's feed-location-images batch.
  useEffect(() => {
    if (!tripIdValid || !authenticated || status !== 'success') return

    let cancelled = false
    void fetchTripDetailLocationImages(tripId)
      .then((imageMap) => {
        if (cancelled) return
        setTripLocations((prev) => mergeLocationImages(prev, imageMap))
      })
      .catch(() => {
        // Keep trip metadata visible; missing images are handled in the UI.
      })

    return () => {
      cancelled = true
    }
  }, [tripId, tripIdValid, authenticated, status])

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
