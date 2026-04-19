import type { AccommodationResponse, HalCollection, HalEntity } from '../types/api'
import { ApiError, getExists, requestJson, requestVoid } from './client'
import { embeddedItems, idFromEntity } from './hal'

type AccommodationEntityBody = {
  type?: string
  name?: string
  address?: string
}

type AccommodationCollection = HalCollection<HalEntity<AccommodationEntityBody>>

function toAccommodation(
  entity: HalEntity<AccommodationEntityBody>,
): AccommodationResponse {
  return {
    id: idFromEntity(entity),
    type: entity.type ?? '',
    name: entity.name ?? '',
    address: entity.address ?? '',
  }
}

export async function listAccommodations(): Promise<AccommodationResponse[]> {
  const model = await requestJson<AccommodationCollection>('/accommodations', {
    method: 'GET',
  })
  const rawItems = [
    ...embeddedItems(model, 'accomEntities'),
    ...embeddedItems(model, 'accommodations'),
  ]
  return rawItems.map(toAccommodation)
}

export async function searchAccommodationsByNameContaining(
  name: string,
): Promise<AccommodationResponse[]> {
  const q = name.trim()
  if (!q) return []
  try {
    const model = await requestJson<AccommodationCollection>(
      `/accommodations/search/findByNameContainingIgnoreCase?name=${encodeURIComponent(q)}`,
      { method: 'GET' },
    )
    const rawItems = [
      ...embeddedItems(model, 'accomEntities'),
      ...embeddedItems(model, 'accommodations'),
    ]
    return rawItems.map(toAccommodation)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return []
    throw e
  }
}

export async function createAccommodation(input: {
  type: string
  name: string
  address: string
}): Promise<AccommodationResponse> {
  const entity = await requestJson<HalEntity<AccommodationEntityBody>>('/accommodations', {
    method: 'POST',
    body: JSON.stringify({
      type: input.type,
      name: input.name,
      address: input.address,
    }),
  })
  return toAccommodation(entity)
}

export async function listTripAccommodationsByTripId(
  tripId: number,
): Promise<AccommodationResponse[]> {
  const model = await requestJson<AccommodationCollection>(
    `/trips/${tripId}/accommodations`,
    {
      method: 'GET',
    },
  )
  const rawItems = [
    ...embeddedItems(model, 'accomEntities'),
    ...embeddedItems(model, 'accommodations'),
  ]
  return rawItems.map(toAccommodation)
}

/**
 * Audit category B fix: append one accommodation with POST instead of
 * replacing the whole association with PUT + text/uri-list.
 */
export async function addTripAccommodation(input: {
  tripId: number
  accommodation: AccommodationResponse
}): Promise<void> {
  const alreadyLinked = await getExists(
    `/trips/${input.tripId}/accommodations/${input.accommodation.id}`,
  )
  if (alreadyLinked) return
  await requestVoid(`/trips/${input.tripId}/accommodations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: `/accommodations/${input.accommodation.id}`,
  })
}

/**
 * Audit category B fix: remove a single accommodation with DELETE on the item
 * URI.
 */
export async function deleteTripAccommodation(
  tripId: number,
  accommodationId: number,
): Promise<void> {
  try {
    await requestVoid(`/trips/${tripId}/accommodations/${accommodationId}`, {
      method: 'DELETE',
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return
    throw err
  }
}
