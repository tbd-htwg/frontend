import { useCallback, useEffect, useMemo, useState } from 'react'

import { getStopExternalInfo, getStopExternalInfoBatch, type PlaceGeoHint } from '../api/externalInfo'
import { sliceErrorMessage } from '../api/loadSlice'
import type { StopExternalInfoResponse, TripLocationResponse } from '../types/api'
import type { SliceStatus } from './useTripDetailCore'

export type StopExternalEntry = {
  info?: StopExternalInfoResponse
  status: SliceStatus
  errorMessage?: string
  placeId?: string
}

function eligibleStops(stops: TripLocationResponse[]) {
  return stops.filter(
    (loc) => Number.isFinite(loc.id) && loc.id > 0 && loc.googlePlaceId,
  )
}

export function useStopExternalInfo(stops: TripLocationResponse[]) {
  const [byStopId, setByStopId] = useState<Record<number, StopExternalEntry>>({})

  const stopPlaceIdsKey = useMemo(() => {
    return eligibleStops(stops)
      .map((loc) => `${loc.id}:${loc.googlePlaceId}`)
      .sort()
      .join(',')
  }, [stops])

  const activeStops = useMemo(() => eligibleStops(stops), [stopPlaceIdsKey])

  const setStopInfo = useCallback(
    (stopId: number, info: StopExternalInfoResponse, placeId: string) => {
      setByStopId((prev) => ({
        ...prev,
        [stopId]: { info, status: 'success', placeId },
      }))
    },
    [],
  )

  useEffect(() => {
    const active = activeStops
    if (!stopPlaceIdsKey || active.length === 0) {
      setByStopId({})
      return
    }

    let cancelled = false

    setByStopId((prev) => {
      const next: Record<number, StopExternalEntry> = { ...prev }
      for (const loc of active) {
        const placeId = loc.googlePlaceId as string
        const existing = prev[loc.id]
        const upToDate =
          existing?.status === 'success' &&
          existing.placeId === placeId &&
          existing.info != null
        if (!upToDate) {
          next[loc.id] = {
            ...existing,
            status: 'loading',
            placeId,
            errorMessage: undefined,
          }
        }
      }
      for (const id of Object.keys(next).map(Number)) {
        if (!active.some((loc) => loc.id === id)) {
          delete next[id]
        }
      }
      return next
    })

    const fetchBatch = async () => {
      const hints: PlaceGeoHint[] = active.map((loc) => ({
        placeId: loc.googlePlaceId as string,
        lat: loc.latitude,
        lon: loc.longitude,
        countryCode: loc.countryCode,
        cityName: loc.cityName,
      }))
      try {
        const byPlaceId = await getStopExternalInfoBatch(hints)
        if (cancelled) return
        setByStopId((prev) => {
          const next = { ...prev }
          for (const loc of active) {
            const placeId = loc.googlePlaceId as string
            const data = byPlaceId[placeId]
            if (data) {
              next[loc.id] = { info: data, status: 'success', placeId }
            } else if (next[loc.id]?.status === 'loading') {
              next[loc.id] = {
                status: 'error',
                placeId,
                errorMessage: 'Travel info unavailable.',
              }
            }
          }
          return next
        })
      } catch (err) {
        if (cancelled) return
        const message = sliceErrorMessage(err, 'Travel info unavailable.')
        setByStopId((prev) => {
          const next = { ...prev }
          for (const loc of active) {
            if (next[loc.id]?.status === 'loading') {
              next[loc.id] = {
                status: 'error',
                placeId: loc.googlePlaceId as string,
                errorMessage: message,
              }
            }
          }
          return next
        })
      }
    }

    void fetchBatch()

    return () => {
      cancelled = true
    }
  }, [stopPlaceIdsKey, activeStops])

  const fetchStopInfo = useCallback(
    async (stopId: number, placeId: string, geo?: Omit<PlaceGeoHint, 'placeId'>) => {
      setByStopId((prev) => ({
        ...prev,
        [stopId]: { status: 'loading', placeId },
      }))
      try {
        const data = await getStopExternalInfo(placeId, geo)
        setByStopId((prev) => ({
          ...prev,
          [stopId]: { info: data, status: 'success', placeId },
        }))
      } catch (err) {
        setByStopId((prev) => ({
          ...prev,
          [stopId]: {
            status: 'error',
            placeId,
            errorMessage: sliceErrorMessage(err, 'Travel info unavailable.'),
          },
        }))
      }
    },
    [],
  )

  const getEntry = useCallback(
    (stopId: number): StopExternalEntry | undefined => byStopId[stopId],
    [byStopId],
  )

  return {
    byStopId,
    setStopInfo,
    fetchStopInfo,
    getEntry,
  }
}
