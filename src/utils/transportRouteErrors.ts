import { ApiError } from '../api/client'
import type { TransportTravelMode } from '../types/api'

import { apiErrorMessage } from './apiErrorMessage'

export type TransportRouteErrorKind = 'not_found' | 'unavailable'

const MODE_LABELS: Record<TransportTravelMode, string> = {
  DRIVE: 'Driving',
  WALK: 'Walking',
  BICYCLE: 'Cycling',
  TRANSIT: 'Transit',
}

function isServiceOutageMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('not configured') ||
    lower.includes('api key') ||
    lower.includes('routes api') ||
    lower.includes('cannot access') ||
    lower.includes('unreachable')
  )
}

export function transportRouteErrorKind(error: unknown): TransportRouteErrorKind {
  if (error instanceof ApiError && error.status === 503) {
    const msg = apiErrorMessage(error, '')
    if (isServiceOutageMessage(msg)) {
      return 'unavailable'
    }
  }
  return 'not_found'
}

function defaultNotFoundMessage(mode: TransportTravelMode): string {
  return `No ${MODE_LABELS[mode].toLowerCase()} route for this trip. Try another mode.`
}

export function transportRouteErrorMessage(
  error: unknown,
  mode: TransportTravelMode,
): string {
  const fromApi = apiErrorMessage(error, '')
  if (fromApi && fromApi !== 'Service Unavailable' && fromApi !== 'Not Found') {
    if (transportRouteErrorKind(error) === 'unavailable') {
      return fromApi
    }
    if (fromApi.toLowerCase().includes('no ') && fromApi.toLowerCase().includes('route')) {
      return fromApi
    }
  }

  if (transportRouteErrorKind(error) === 'unavailable' && fromApi) {
    return fromApi
  }

  return defaultNotFoundMessage(mode)
}

export const ROUTE_MODE_HINT =
  'Route availability depends on distance and region for every mode — not only cycling or transit.'
