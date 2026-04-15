import type {
  HalCollection,
  HalEntity,
  TripCreateRequest,
  TripDetailsResponse,
  TripListItemResponse,
  TripPatchRequest,
  TripPutRequest,
  UserResponse,
} from '../types/api'
import { requestJson, requestVoid } from './client'
import { embeddedItems, hrefForResource, idFromEntity } from './hal'

type TripEntityBody = {
  title?: string
  destination?: string
  startDate?: string
  shortDescription?: string
  longDescription?: string
}

function toTripSummary(entity: HalEntity<TripEntityBody>): TripListItemResponse {
  return {
    id: idFromEntity(entity),
    title: entity.title ?? '',
    destination: entity.destination ?? '',
    startDate: entity.startDate ?? '',
    shortDescription: entity.shortDescription ?? '',
  }
}

function toTripDetails(entity: HalEntity<TripEntityBody>): TripDetailsResponse {
  return {
    ...toTripSummary(entity),
    longDescription: entity.longDescription ?? '',
  }
}

function toTripRequest(body: TripCreateRequest | TripPutRequest | TripPatchRequest) {
  return {
    user: body.userId ? hrefForResource(`/users/${body.userId}`) : undefined,
    title: body.title,
    destination: body.destination,
    startDate: body.startDate,
    shortDescription: body.shortDescription,
    longDescription: body.longDescription,
  }
}

type TripCollection = HalCollection<HalEntity<TripEntityBody>>

export async function listTrips(): Promise<TripListItemResponse[]> {
  const model = await requestJson<TripCollection>('/trips', { method: 'GET' })
  return embeddedItems(model, 'trips').map(toTripSummary)
}

export async function findTripsByUserId(userId: number): Promise<TripListItemResponse[]> {
  const model = await requestJson<TripCollection>(
    `/trips/search/findByUserId?userId=${userId}`,
    { method: 'GET' },
  )
  return embeddedItems(model, 'trips').map(toTripSummary)
}

export async function searchTripsByLikedUser(userId: number): Promise<TripListItemResponse[]> {
  const model = await requestJson<TripCollection>(
    `/trips/search/findByLikedByUsersId?userId=${userId}`,
    { method: 'GET' },
  )
  return embeddedItems(model, 'trips').map(toTripSummary)
}

export function countTripLikes(tripId: number): Promise<number> {
  return requestJson<number>(`/trips/search/countLikes?tripId=${tripId}`, { method: 'GET' })
}

export async function getTripOwner(tripId: number): Promise<UserResponse> {
  const entity = await requestJson<
    HalEntity<{ email?: string; name?: string; imageUrl?: string; description?: string }>
  >(`/trips/${tripId}/user`, { method: 'GET' })
  return {
    id: idFromEntity(entity),
    email: entity.email ?? '',
    name: entity.name ?? '',
    imageUrl: entity.imageUrl ?? '',
    description: entity.description ?? '',
  }
}

export async function getTrip(id: number): Promise<TripDetailsResponse> {
  const entity = await requestJson<HalEntity<TripEntityBody>>(`/trips/${id}`, {
    method: 'GET',
  })
  return toTripDetails(entity)
}

export async function createTrip(body: TripCreateRequest): Promise<TripDetailsResponse> {
  const entity = await requestJson<HalEntity<TripEntityBody>>('/trips', {
    method: 'POST',
    body: JSON.stringify(toTripRequest(body)),
  })
  return toTripDetails(entity)
}

export async function replaceTrip(
  id: number,
  body: TripPutRequest,
): Promise<TripDetailsResponse> {
  const entity = await requestJson<HalEntity<TripEntityBody>>(`/trips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toTripRequest(body)),
  })
  return toTripDetails(entity)
}

export async function patchTrip(
  id: number,
  body: TripPatchRequest,
): Promise<TripDetailsResponse> {
  const entity = await requestJson<HalEntity<TripEntityBody>>(`/trips/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toTripRequest(body)),
  })
  return toTripDetails(entity)
}

export function deleteTrip(id: number): Promise<void> {
  return requestVoid(`/trips/${id}`, { method: 'DELETE' })
}
