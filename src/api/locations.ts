import type { HalCollection, HalEntity, LocationResponse } from '../types/api'
import { ApiError, requestJson } from './client'
import { embeddedItems, idFromEntity } from './hal'

type LocationEntityBody = {
  city?: string
  countryCode?: string
  latitude?: number
  longitude?: number
  formattedAddress?: string
}

function toLocation(entity: HalEntity<LocationEntityBody>): LocationResponse {
  return {
    id: idFromEntity(entity),
    city: entity.city ?? '',
    countryCode: entity.countryCode,
    latitude: entity.latitude,
    longitude: entity.longitude,
    formattedAddress: entity.formattedAddress,
  }
}

type LocationCollection = HalCollection<HalEntity<LocationEntityBody>>

export async function listLocations(): Promise<LocationResponse[]> {
  const model = await requestJson<LocationCollection>('/locations', { method: 'GET' })
  return embeddedItems(model, 'locations').map(toLocation)
}

/**
 * Audit category A fix: paginated. Empty `city` matches every row (LIKE '%%')
 * so this can be called on focus to prefill a suggestion dropdown;
 * `sort=id,desc` puts the newest locations first (IDENTITY ids preserve
 * insertion order).
 */
const LOCATION_SUGGESTION_PAGE_SIZE = 10

export async function searchLocationsByCityContaining(
  city: string,
  size: number = LOCATION_SUGGESTION_PAGE_SIZE,
): Promise<LocationResponse[]> {
  const q = city.trim()
  const params = new URLSearchParams({
    city: q,
    size: String(size),
    sort: 'id,desc',
  })
  try {
    const model = await requestJson<LocationCollection>(
      `/locations/search/findByCityContainingIgnoreCase?${params.toString()}`,
      { method: 'GET' },
    )
    return embeddedItems(model, 'locations').map(toLocation)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return []
    throw e
  }
}

export async function getLocationById(id: number): Promise<LocationResponse> {
  const entity = await requestJson<HalEntity<LocationEntityBody>>(`/locations/${id}`, {
    method: 'GET',
  })
  return toLocation(entity)
}

export async function createLocation(city: string): Promise<LocationResponse> {
  const entity = await requestJson<HalEntity<LocationEntityBody>>('/locations', {
    method: 'POST',
    body: JSON.stringify({ city }),
  })
  return toLocation(entity)
}
