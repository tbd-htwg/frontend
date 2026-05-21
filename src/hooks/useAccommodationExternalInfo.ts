import { useEffect, useMemo, useState } from 'react'

import {
  getAccommodationExternalInfoBatch,
  type AccommodationExternalHint,
} from '../api/externalInfo'
import { sliceErrorMessage } from '../api/loadSlice'
import type { AccommodationExternalInfoResponse, AccommodationResponse } from '../types/api'
import type { SliceStatus } from './useTripDetailCore'

export type AccommodationExternalEntry = {
  info?: AccommodationExternalInfoResponse
  status: SliceStatus
  errorMessage?: string
}

function eligibleAccommodations(items: AccommodationResponse[]) {
  return items.filter(
    (a) => Number.isFinite(a.id) && a.id > 0 && a.googlePlaceId,
  )
}

function hasValidGeo(lat?: number, lon?: number): boolean {
  return lat != null && lon != null && (lat !== 0 || lon !== 0)
}

export function useAccommodationExternalInfo(accommodations: AccommodationResponse[]) {
  const [byAccommodationId, setByAccommodationId] = useState<
    Record<number, AccommodationExternalEntry>
  >({})

  const accomKey = useMemo(() => {
    return eligibleAccommodations(accommodations)
      .map(
        (a) =>
          `${a.id}:${a.googlePlaceId}:${a.cost ?? ''}:${a.currency ?? ''}:${a.latitude ?? ''}:${a.longitude ?? ''}`,
      )
      .sort()
      .join(',')
  }, [accommodations])

  const activeAccommodations = useMemo(
    () => eligibleAccommodations(accommodations),
    [accomKey],
  )

  useEffect(() => {
    const active = activeAccommodations
    if (!accomKey || active.length === 0) {
      setByAccommodationId({})
      return
    }

    let cancelled = false

    setByAccommodationId((prev) => {
      const next: Record<number, AccommodationExternalEntry> = { ...prev }
      for (const accom of active) {
        if (!hasValidGeo(accom.latitude, accom.longitude) && !accom.googlePlaceId) {
          continue
        }
        next[accom.id] = { status: 'loading', errorMessage: undefined }
      }
      return next
    })

    const fetchBatch = async () => {
      const hints: AccommodationExternalHint[] = active
        .filter((a) => a.googlePlaceId)
        .map((a) => ({
          key: String(a.id),
          placeId: a.googlePlaceId as string,
          lat: a.latitude,
          lon: a.longitude,
          countryCode: a.countryCode,
          cityName: a.cityName,
          cost: a.cost,
          currency: a.currency,
        }))

      if (!hints.length) return

      try {
        const byKey = await getAccommodationExternalInfoBatch(hints)
        if (cancelled) return
        setByAccommodationId((prev) => {
          const next = { ...prev }
          for (const accom of active) {
            const data = byKey[String(accom.id)]
            if (data) {
              next[accom.id] = { info: data, status: 'success' }
            } else {
              next[accom.id] = {
                status: 'error',
                errorMessage: 'Activity suggestions unavailable.',
              }
            }
          }
          return next
        })
      } catch (err) {
        if (cancelled) return
        const message = sliceErrorMessage(err, 'Activity suggestions unavailable.')
        setByAccommodationId((prev) => {
          const next = { ...prev }
          for (const accom of active) {
            next[accom.id] = { status: 'error', errorMessage: message }
          }
          return next
        })
      }
    }

    void fetchBatch()

    return () => {
      cancelled = true
    }
  }, [accomKey, activeAccommodations])

  const getEntry = (accommodationId: number): AccommodationExternalEntry | undefined =>
    byAccommodationId[accommodationId]

  return { getEntry }
}
