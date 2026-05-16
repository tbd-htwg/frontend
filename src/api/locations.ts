import type { HalCollection, HalEntity, LocationResponse } from '../types/api'
import { ApiError, requestJson } from './client'
import { embeddedItems, idFromEntity } from './hal'

type LocationEntityBody = {
  city?: string
  name?: string
}

function toLocation(entity: HalEntity<LocationEntityBody>): LocationResponse {
  return {
    id: idFromEntity(entity),
    name: entity.city ?? entity.name ?? '',
  }
}

type LocationCollection = HalCollection<HalEntity<LocationEntityBody>>

export async function listLocations(): Promise<LocationResponse[]> {
  const model = await requestJson<LocationCollection>('/locations', { method: 'GET' })
  return embeddedItems(model, 'locations').map(toLocation)
}

/**
 * Paginated city search for location suggestions.
 * Empty `city` matches every row (LIKE '%%') on focus; `sort=id,desc` prefers newest rows.
 */
const LOCATION_SUGGESTION_PAGE_SIZE = 10

export async function searchLocationsByNameContaining(
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
