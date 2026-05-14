import { requestJson } from './client'
import type { TripExternalInfoResponse } from '../types/api'

/**
 * Fetches travel information through the backend gateway.
 */
export async function getExternalTripInfo(
  location: string,
  countryCode: string = 'FR'
): Promise<TripExternalInfoResponse> {
  const encodedLocation = encodeURIComponent(location)
  return requestJson<TripExternalInfoResponse>(
    `/api/v2/external/details?location=${encodedLocation}&countryCode=${countryCode}`
  )
}