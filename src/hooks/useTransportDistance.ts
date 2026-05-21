import { useEffect, useMemo, useState } from 'react'

import { getTransportDistance } from '../api/externalInfo'
import { sliceErrorMessage } from '../api/loadSlice'
import type { TransportDistanceLegResponse, TransportResponse } from '../types/api'
import type { SliceStatus } from './useTripDetailCore'

export type TransportDistanceEntry = {
  legs?: TransportDistanceLegResponse[]
  status: SliceStatus
  errorMessage?: string
}

function hasValidCoords(lat?: number, lon?: number): boolean {
  return lat != null && lon != null && (lat !== 0 || lon !== 0)
}

function transportCoordKey(t: TransportResponse): string | null {
  if (
    !hasValidCoords(t.startLatitude, t.startLongitude) ||
    !hasValidCoords(t.endLatitude, t.endLongitude)
  ) {
    return null
  }
  return `${t.id}:${t.startLatitude},${t.startLongitude}-${t.endLatitude},${t.endLongitude}`
}

export function useTransportDistance(transports: TransportResponse[]) {
  const [byTransportId, setByTransportId] = useState<Record<number, TransportDistanceEntry>>({})

  const transportKey = useMemo(() => {
    return transports
      .map(transportCoordKey)
      .filter((k): k is string => k != null)
      .sort()
      .join('|')
  }, [transports])

  const activeTransports = useMemo(
    () =>
      transports.filter((t) => transportCoordKey(t) != null),
    [transportKey],
  )

  useEffect(() => {
    if (!transportKey || activeTransports.length === 0) {
      setByTransportId({})
      return
    }

    let cancelled = false

    setByTransportId((prev) => {
      const next: Record<number, TransportDistanceEntry> = { ...prev }
      for (const t of activeTransports) {
        next[t.id] = { status: 'loading', errorMessage: undefined }
      }
      for (const id of Object.keys(next).map(Number)) {
        if (!activeTransports.some((t) => t.id === id)) {
          delete next[id]
        }
      }
      return next
    })

    const fetchAll = async () => {
      await Promise.all(
        activeTransports.map(async (t) => {
          try {
            const result = await getTransportDistance(
              t.startLatitude as number,
              t.startLongitude as number,
              t.endLatitude as number,
              t.endLongitude as number,
            )
            if (cancelled) return
            setByTransportId((prev) => ({
              ...prev,
              [t.id]: { legs: result.legs, status: 'success' },
            }))
          } catch (err) {
            if (cancelled) return
            setByTransportId((prev) => ({
              ...prev,
              [t.id]: {
                status: 'error',
                errorMessage: sliceErrorMessage(err, 'Route distance unavailable.'),
              },
            }))
          }
        }),
      )
    }

    void fetchAll()

    return () => {
      cancelled = true
    }
  }, [transportKey])

  const getEntry = (transportId: number): TransportDistanceEntry | undefined =>
    byTransportId[transportId]

  return { getEntry }
}
