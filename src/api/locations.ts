import type { HalCollection, HalEntity, LocationResponse } from '../types/api'
import { requestJson } from './client'
import { embeddedItems, idFromEntity } from './hal'

type LocationEntityBody = {
  name?: string
}

function toLocation(entity: HalEntity<LocationEntityBody>): LocationResponse {
  return {
    id: idFromEntity(entity),
    name: entity.name ?? '',
  }
}

type LocationCollection = HalCollection<HalEntity<LocationEntityBody>>

export async function listLocations(): Promise<LocationResponse[]> {
  const model = await requestJson<LocationCollection>('/locations', { method: 'GET' })
  return embeddedItems(model, 'locations').map(toLocation)
}

export async function getLocationById(id: number): Promise<LocationResponse> {
  const entity = await requestJson<HalEntity<LocationEntityBody>>(`/locations/${id}`, {
    method: 'GET',
  })
  return toLocation(entity)
}

export async function createLocation(name: string): Promise<LocationResponse> {
  const entity = await requestJson<HalEntity<LocationEntityBody>>('/locations', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return toLocation(entity)
}
