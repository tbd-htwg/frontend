import { requestJson } from './client'
import type { GeocodingSuggestion, TripExternalInfoResponse } from '../types/api'

/**
 * Fetches travel information through the backend gateway (trip destination widget).
 */
export async function getExternalTripInfo(
  location: string,
  countryCode: string,
  lat?: number,
  lon?: number,
): Promise<TripExternalInfoResponse> {
  let url = `/external/details?location=${encodeURIComponent(location)}&countryCode=${encodeURIComponent(countryCode)}`
  if (lat != null && lon != null) {
    url += `&lat=${lat}&lon=${lon}`
  }
  return requestJson<TripExternalInfoResponse>(url)
}

export async function searchGeocodeSuggestions(query: string): Promise<GeocodingSuggestion[]> {
  const q = query.trim()
  if (!q) return []
  const encoded = encodeURIComponent(q)
  const results = await requestJson<GeocodingSuggestion[]>(`/external/details/search?q=${encoded}`)
  return Array.isArray(results) ? results : []
}
