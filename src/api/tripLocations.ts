import type {
  HalCollection,
  HalEntity,
  LocationResponse,
  TripLocationResponse,
} from '../types/api'
import { requestJson, requestVoid } from './client'
import {
  embeddedItems,
  hrefForResource,
  idFromEntity,
  idFromHref,
  pathFromHref,
} from './hal'
import { getLocationById } from './locations'

type TripLocationEntityBody = {
  description?: string
  imageUrl?: string
}

function toTripLocation(entity: HalEntity<TripLocationEntityBody>): TripLocationResponse {
  return {
    id: idFromEntity(entity),
    tripId: idFromHref(entity._links?.trip?.href),
    locationId: idFromHref(entity._links?.location?.href),
    description: entity.description ?? '',
    imageUrl: entity.imageUrl ?? '',
    locationName: '',
  }
}

type TripLocationCollection = HalCollection<HalEntity<TripLocationEntityBody>>

/**
 * Audit category D: the repository query is paginated server-side; ask for a
 * generous upper bound instead of relying on the default page of 20. Real
 * pagination UI would replace this.
 */
const TRIP_LOCATIONS_PAGE_SIZE = 200

export async function listTripLocationsByTripId(
  tripId: number,
): Promise<TripLocationResponse[]> {
  const model = await requestJson<TripLocationCollection>(
    `/trip-locations/search/findByTripId?tripId=${tripId}&size=${TRIP_LOCATIONS_PAGE_SIZE}`,
    { method: 'GET' },
  )
  // Spring Data REST uses "trip-locations" as the HAL collection key.
  const rawEntries = [
    ...embeddedItems(model, 'trip-locations'),
    ...embeddedItems(model, 'tripLocations'),
  ]
  return Promise.all(
    rawEntries.map(async (rawEntry) => {
      const entry = toTripLocation(rawEntry)
      const locationHref = rawEntry._links?.location?.href
      const location = locationHref
        ? await requestJson<{ name?: string }>(pathFromHref(locationHref), {
            method: 'GET',
          })
        : Number.isFinite(entry.locationId)
          ? await getLocationById(entry.locationId)
          : { name: 'Unknown location' }
      return {
        ...entry,
        locationName: location.name ?? 'Unknown location',
      }
    }),
  )
}

export async function addTripLocation(input: {
  tripId: number
  location: LocationResponse
  description: string
}): Promise<TripLocationResponse> {
  const entity = await requestJson<HalEntity<TripLocationEntityBody>>('/trip-locations', {
    method: 'POST',
    body: JSON.stringify({
      trip: hrefForResource(`/trips/${input.tripId}`),
      location: hrefForResource(`/locations/${input.location.id}`),
      description: input.description,
      imageUrl: '',
    }),
  })
  return {
    ...toTripLocation(entity),
    locationName: input.location.name,
  }
}

export function deleteTripLocation(id: number): Promise<void> {
  return requestVoid(`/trip-locations/${id}`, { method: 'DELETE' })
}
