import { requestJson } from './client'
import type {
  AccommodationExternalInfoResponse,
  PlaceSuggestion,
  StopExternalInfoResponse,
  TripExternalInfoResponse,
} from '../types/api'

export type PlaceGeoHint = {
  placeId: string
  lat?: number
  lon?: number
  countryCode?: string
  cityName?: string
}

export type AccommodationExternalHint = PlaceGeoHint & {
  key: string
  cost?: number
  currency?: string
}

/** @deprecated Use getStopExternalInfo for trip stops. */
export async function getExternalTripInfo(
  placeId: string,
  geo?: Omit<PlaceGeoHint, 'placeId'>,
): Promise<TripExternalInfoResponse> {
  const params = new URLSearchParams({ placeId })
  if (geo?.lat != null) params.set('lat', String(geo.lat))
  if (geo?.lon != null) params.set('lon', String(geo.lon))
  if (geo?.countryCode) params.set('countryCode', geo.countryCode)
  if (geo?.cityName) params.set('cityName', geo.cityName)
  return requestJson<TripExternalInfoResponse>(`/external/details?${params.toString()}`)
}

export async function getStopExternalInfo(
  placeId: string,
  geo?: Omit<PlaceGeoHint, 'placeId'>,
): Promise<StopExternalInfoResponse> {
  const params = new URLSearchParams({ placeId })
  if (geo?.lat != null) params.set('lat', String(geo.lat))
  if (geo?.lon != null) params.set('lon', String(geo.lon))
  if (geo?.countryCode) params.set('countryCode', geo.countryCode)
  if (geo?.cityName) params.set('cityName', geo.cityName)
  return requestJson<StopExternalInfoResponse>(`/external/stop-details?${params.toString()}`)
}

export async function getStopExternalInfoBatch(
  places: PlaceGeoHint[],
): Promise<Record<string, StopExternalInfoResponse>> {
  if (!places.length) return {}
  const params = buildGeoBatchParams(places)
  return requestJson<Record<string, StopExternalInfoResponse>>(
    `/external/stop-details/batch?${params.toString()}`,
  )
}

export async function getAccommodationExternalInfoBatch(
  items: AccommodationExternalHint[],
): Promise<Record<string, AccommodationExternalInfoResponse>> {
  if (!items.length) return {}
  const params = new URLSearchParams({
    keys: items.map((i) => i.key).join(','),
    placeIds: items.map((i) => i.placeId).join(','),
  })
  const lats = items.map((i) => (i.lat != null ? String(i.lat) : '')).join(',')
  const lons = items.map((i) => (i.lon != null ? String(i.lon) : '')).join(',')
  const countries = items.map((i) => i.countryCode ?? '').join(',')
  const cities = items.map((i) => i.cityName ?? '').join(',')
  const costs = items.map((i) => (i.cost != null ? String(i.cost) : '')).join(',')
  const currencies = items.map((i) => i.currency ?? '').join(',')
  if (lats.replace(/,/g, '').length > 0) params.set('lats', lats)
  if (lons.replace(/,/g, '').length > 0) params.set('lons', lons)
  if (countries.replace(/,/g, '').length > 0) params.set('countryCodes', countries)
  if (cities.replace(/,/g, '').length > 0) params.set('cityNames', cities)
  if (costs.replace(/,/g, '').length > 0) params.set('costs', costs)
  if (currencies.replace(/,/g, '').length > 0) params.set('currencies', currencies)
  return requestJson<Record<string, AccommodationExternalInfoResponse>>(
    `/external/accommodation-details/batch?${params.toString()}`,
  )
}

function buildGeoBatchParams(places: PlaceGeoHint[]): URLSearchParams {
  const params = new URLSearchParams({
    placeIds: places.map((p) => p.placeId).join(','),
  })
  const lats = places.map((p) => (p.lat != null ? String(p.lat) : '')).join(',')
  const lons = places.map((p) => (p.lon != null ? String(p.lon) : '')).join(',')
  const countries = places.map((p) => p.countryCode ?? '').join(',')
  const cities = places.map((p) => p.cityName ?? '').join(',')
  if (lats.replace(/,/g, '').length > 0) params.set('lats', lats)
  if (lons.replace(/,/g, '').length > 0) params.set('lons', lons)
  if (countries.replace(/,/g, '').length > 0) params.set('countryCodes', countries)
  if (cities.replace(/,/g, '').length > 0) params.set('cityNames', cities)
  return params
}

/** @deprecated Use getStopExternalInfoBatch */
export const getExternalTripInfoBatch = getStopExternalInfoBatch

export async function searchPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim()
  if (!q) return []
  const encoded = encodeURIComponent(q)
  const results = await requestJson<PlaceSuggestion[]>(`/external/details/search?q=${encoded}`)
  return Array.isArray(results) ? results : []
}

/** @deprecated Use searchPlaceSuggestions */
export const searchGeocodeSuggestions = searchPlaceSuggestions
