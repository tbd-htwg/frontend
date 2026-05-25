import { useCallback, useEffect, useMemo, useState } from 'react'

import { getTransportRoute } from '../api/externalInfo'
import type { TransportRouteErrorKind } from '../utils/transportRouteErrors'
import {
  transportRouteErrorKind,
  transportRouteErrorMessage,
} from '../utils/transportRouteErrors'
import type { TransportRouteResponse, TransportResponse, TransportTravelMode } from '../types/api'
import type { SliceStatus } from './useTripDetailCore'

export type TransportRouteEntry = {
  selectedMode: TransportTravelMode
  route?: TransportRouteResponse
  status: SliceStatus
  errorMessage?: string
  errorKind?: TransportRouteErrorKind
}

const DEFAULT_MODE: TransportTravelMode = 'DRIVE'

function hasValidCoords(lat?: number, lon?: number): boolean {
  return lat != null && lon != null && (lat !== 0 || lon !== 0)
}

function transportFetchKey(t: TransportResponse, mode: TransportTravelMode): string | null {
  if (
    !hasValidCoords(t.startLatitude, t.startLongitude) ||
    !hasValidCoords(t.endLatitude, t.endLongitude)
  ) {
    return null
  }
  return `${t.id}:${mode}:${t.startLatitude},${t.startLongitude}-${t.endLatitude},${t.endLongitude}`
}

export function useTransportRoute(transports: TransportResponse[]) {
  const [modes, setModes] = useState<Record<number, TransportTravelMode>>({})
  const [byTransportId, setByTransportId] = useState<Record<number, TransportRouteEntry>>({})

  const activeTransports = useMemo(
    () => transports.filter((t) => transportFetchKey(t, modes[t.id] ?? DEFAULT_MODE) != null),
    [transports, modes],
  )

  const fetchKey = useMemo(
    () =>
      activeTransports
        .map((t) => transportFetchKey(t, modes[t.id] ?? DEFAULT_MODE))
        .filter((k): k is string => k != null)
        .sort()
        .join('|'),
    [activeTransports, modes],
  )

  useEffect(() => {
    if (!fetchKey || activeTransports.length === 0) {
      setByTransportId({})
      return
    }

    let cancelled = false

    setByTransportId((prev) => {
      const next: Record<number, TransportRouteEntry> = { ...prev }
      for (const t of activeTransports) {
        const mode = modes[t.id] ?? DEFAULT_MODE
        next[t.id] = {
          selectedMode: mode,
          route: prev[t.id]?.selectedMode === mode ? prev[t.id]?.route : undefined,
          status: 'loading',
          errorMessage: undefined,
          errorKind: undefined,
        }
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
          const mode = modes[t.id] ?? DEFAULT_MODE
          try {
            const route = await getTransportRoute(
              t.startLatitude as number,
              t.startLongitude as number,
              t.endLatitude as number,
              t.endLongitude as number,
              mode,
            )
            if (cancelled) return
            setByTransportId((prev) => ({
              ...prev,
              [t.id]: { selectedMode: mode, route, status: 'success', errorKind: undefined },
            }))
          } catch (err) {
            if (cancelled) return
            setByTransportId((prev) => ({
              ...prev,
              [t.id]: {
                selectedMode: mode,
                status: 'error',
                errorKind: transportRouteErrorKind(err),
                errorMessage: transportRouteErrorMessage(err, mode),
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
  }, [fetchKey])

  const setMode = useCallback((transportId: number, mode: TransportTravelMode) => {
    setModes((prev) => ({ ...prev, [transportId]: mode }))
  }, [])

  const getEntry = (transportId: number): TransportRouteEntry | undefined => {
    const stored = byTransportId[transportId]
    const mode = modes[transportId] ?? DEFAULT_MODE
    if (stored) {
      return { ...stored, selectedMode: mode }
    }
    if (activeTransports.some((t) => t.id === transportId)) {
      return { selectedMode: mode, status: 'loading' }
    }
    return undefined
  }

  return { getEntry, setMode }
}
