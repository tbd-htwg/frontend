import type { AccommodationResponse, HalCollection, HalEntity } from '../types/api'
import { requestJson, requestVoid } from './client'
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

function toUriList(ids: number[]): string {
  if (ids.length === 0) return ''
  return ids.map((id) => `/accommodations/${id}`).join('\n')
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

export async function addTripAccommodation(input: {
  tripId: number
  accommodation: AccommodationResponse
}): Promise<void> {
  const current = await listTripAccommodationsByTripId(input.tripId)
  if (current.some((item) => item.id === input.accommodation.id)) return
  const nextIds = [...current.map((item) => item.id), input.accommodation.id]
  await requestVoid(`/trips/${input.tripId}/accommodations`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: toUriList(nextIds),
  })
}

export async function deleteTripAccommodation(
  tripId: number,
  accommodationId: number,
): Promise<void> {
  const current = await listTripAccommodationsByTripId(tripId)
  const nextIds = current.map((item) => item.id).filter((id) => id !== accommodationId)
  await requestVoid(`/trips/${tripId}/accommodations`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: toUriList(nextIds),
  })
}
