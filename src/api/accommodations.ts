import type { AccommodationResponse, HalCollection, HalEntity } from '../types/api'
import { ApiError, getExists, requestJson, requestVoid } from './client'
import { embeddedItems, idFromEntity } from './hal'

type AccommodationEntityBody = {
  type?: string
  name?: string
  address?: string
  googlePlaceId?: string
  checkInDate?: string
  checkOutDate?: string
  cost?: number
  currency?: string
}

type AccommodationCreatedBody = AccommodationEntityBody & { id: number }

type AccommodationCollection = HalCollection<HalEntity<AccommodationEntityBody>>

function toAccommodation(
  entity: HalEntity<AccommodationEntityBody> | AccommodationCreatedBody,
): AccommodationResponse {
  const id =
    'id' in entity && typeof (entity as AccommodationCreatedBody).id === 'number'
      ? (entity as AccommodationCreatedBody).id
      : idFromEntity(entity as HalEntity<AccommodationEntityBody>)
  return {
    id,
    type: entity.type ?? '',
    name: entity.name ?? '',
    address: entity.address ?? '',
    googlePlaceId: entity.googlePlaceId,
    checkInDate: entity.checkInDate,
    checkOutDate: entity.checkOutDate,
    cost: entity.cost,
    currency: entity.currency,
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

export async function createAccommodation(input: {
  googlePlaceId: string
  checkInDate: string
  checkOutDate: string
  cost: number
  currency: string
}): Promise<AccommodationResponse> {
  const body = await requestJson<AccommodationCreatedBody>('/accommodations', {
    method: 'POST',
    body: JSON.stringify({
      googlePlaceId: input.googlePlaceId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      cost: input.cost,
      currency: input.currency.toUpperCase(),
    }),
  })
  return toAccommodation(body)
}

export async function updateAccommodation(
  id: number,
  input: {
    googlePlaceId: string
    checkInDate: string
    checkOutDate: string
    cost: number
    currency: string
  },
): Promise<AccommodationResponse> {
  const body = await requestJson<AccommodationCreatedBody>(`/accommodations/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      googlePlaceId: input.googlePlaceId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      cost: input.cost,
      currency: input.currency.toUpperCase(),
    }),
  })
  return toAccommodation(body)
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
  skipLinkCheck?: boolean
}): Promise<void> {
  if (!input.skipLinkCheck) {
    const alreadyLinked = await getExists(
      `/trips/${input.tripId}/accommodations/${input.accommodation.id}`,
    )
    if (alreadyLinked) return
  }
  await requestVoid(`/trips/${input.tripId}/accommodations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: `/accommodations/${input.accommodation.id}`,
  })
}

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
