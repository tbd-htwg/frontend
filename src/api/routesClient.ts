import { getGoogleMapsApiKey } from '../lib/googleMapsConfig'
import type { TransportRouteResponse, TransportTravelMode } from '../types/api'

import { ApiError } from './client'

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const ROUTES_FIELD_MASK = 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline'

const ALLOWED_MODES = new Set<TransportTravelMode>(['DRIVE', 'WALK', 'BICYCLE', 'TRANSIT'])

function normalizeTravelMode(mode: TransportTravelMode): TransportTravelMode | null {
  return ALLOWED_MODES.has(mode) ? mode : null
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${meters} m`
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} h ${minutes} min`
  }
  return `${minutes} min`
}

function parseDurationSeconds(duration: unknown): number | null {
  if (typeof duration === 'string' && duration.endsWith('s')) {
    const parsed = Number.parseInt(duration.slice(0, -1), 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (duration != null && typeof duration === 'object' && 'seconds' in duration) {
    const seconds = (duration as { seconds?: unknown }).seconds
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      return seconds
    }
    if (typeof seconds === 'string') {
      const parsed = Number.parseInt(seconds, 10)
      return Number.isFinite(parsed) ? parsed : null
    }
  }
  return null
}

function mapRouteResponse(
  data: unknown,
  mode: TransportTravelMode,
): TransportRouteResponse | null {
  if (!data || typeof data !== 'object') return null
  const routes = (data as { routes?: unknown }).routes
  if (!Array.isArray(routes) || routes.length === 0) return null
  const route = routes[0]
  if (!route || typeof route !== 'object') return null
  const distanceMeters = (route as { distanceMeters?: unknown }).distanceMeters
  const durationRaw = (route as { duration?: unknown }).duration
  const polylineObj = (route as { polyline?: unknown }).polyline
  const encodedPolyline =
    polylineObj != null &&
    typeof polylineObj === 'object' &&
    typeof (polylineObj as { encodedPolyline?: unknown }).encodedPolyline === 'string'
      ? ((polylineObj as { encodedPolyline: string }).encodedPolyline as string)
      : null
  if (
    typeof distanceMeters !== 'number' ||
    !Number.isFinite(distanceMeters) ||
    !encodedPolyline?.trim()
  ) {
    return null
  }
  const durationSeconds = parseDurationSeconds(durationRaw)
  if (durationSeconds == null) return null
  return {
    mode,
    distanceMeters,
    durationSeconds,
    distanceText: formatDistance(distanceMeters),
    durationText: formatDuration(durationSeconds),
    encodedPolyline,
  }
}

function buildRouteRequestBody(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  travelMode: TransportTravelMode,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    origin: {
      location: { latLng: { latitude: originLat, longitude: originLon } },
    },
    destination: {
      location: { latLng: { latitude: destLat, longitude: destLon } },
    },
    travelMode,
    polylineEncoding: 'ENCODED_POLYLINE',
    polylineQuality: 'OVERVIEW',
  }
  if (travelMode === 'DRIVE') {
    body.routingPreference = 'TRAFFIC_AWARE'
  }
  if (travelMode === 'TRANSIT') {
    body.departureTime = new Date().toISOString()
  }
  return body
}

function mapRoutesHttpError(status: number, bodyText: string): ApiError {
  const lower = bodyText.toLowerCase()
  if (status === 403 || status === 401) {
    return new ApiError(
      'GOOGLE_MAPS_API_KEY cannot access Routes API (check key restrictions and enable Routes API).',
      503,
    )
  }
  if (status >= 500) {
    return new ApiError('Routes service is temporarily unreachable. Try again later.', 503)
  }
  if (
    lower.includes('route') ||
    lower.includes('not found') ||
    lower.includes('invalid_argument') ||
    lower.includes('no path') ||
    lower.includes('zero results')
  ) {
    return new ApiError('Not Found', 404)
  }
  return new ApiError('Not Found', 404)
}

/** Compute a transport route via Google Routes API v2 (browser key, uncached). */
export async function computeTransportRoute(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  mode: TransportTravelMode,
): Promise<TransportRouteResponse> {
  const normalized = normalizeTravelMode(mode)
  if (normalized == null) {
    throw new ApiError('Invalid mode. Allowed: DRIVE, WALK, BICYCLE, TRANSIT', 400)
  }
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) {
    throw new ApiError(
      'GOOGLE_MAPS_API_KEY is not configured (set VITE_GOOGLE_MAPS_API_KEY in frontend/.env)',
      503,
    )
  }

  const response = await fetch(ROUTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': ROUTES_FIELD_MASK,
    },
    body: JSON.stringify(
      buildRouteRequestBody(originLat, originLon, destLat, destLon, normalized),
    ),
  })

  const bodyText = await response.text()
  if (!response.ok) {
    throw mapRoutesHttpError(response.status, bodyText)
  }

  let data: unknown
  try {
    data = JSON.parse(bodyText)
  } catch {
    throw new ApiError('Routes service is temporarily unreachable. Try again later.', 503)
  }

  const mapped = mapRouteResponse(data, normalized)
  if (!mapped) {
    throw new ApiError('Not Found', 404)
  }
  return mapped
}
