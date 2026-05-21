import type { PlaceSuggestion, TransportResponse } from '../types/api'

/** Merge Google Places search coordinates into a transport row (create/update responses omit lat/lon). */
export function transportWithPlaceCoords(
  transport: TransportResponse,
  start: PlaceSuggestion,
  end: PlaceSuggestion,
): TransportResponse {
  return {
    ...transport,
    startLatitude: start.lat,
    startLongitude: start.lon,
    endLatitude: end.lat,
    endLongitude: end.lon,
    startAddress: start.formattedAddress,
    endAddress: end.formattedAddress,
  }
}
