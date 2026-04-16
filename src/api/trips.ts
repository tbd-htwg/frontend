import type {
  HalCollection,
  HalEntity,
  PaginatedResponse,
  TripCreateRequest,
  TripDetailsResponse,
  TripListItemResponse,
  TripPatchRequest,
  TripPutRequest,
  UserResponse,
} from '../types/api'
import { requestJson, requestVoid } from './client'
import { hrefForResource, idFromEntity, paginatedItems } from './hal'

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

function toTripPage(model: TripCollection): PaginatedResponse<TripListItemResponse> {
  const page = paginatedItems(model, 'trips')
  return {
    ...page,
    items: page.items.map(toTripSummary),
  }
}

function pageQuery(page: number, size: number): string {
  const params = new URLSearchParams({
    page: String(Math.max(0, page - 1)),
    size: String(size),
  })
  return params.toString()
}

export async function listTrips(
  page = 1,
  size = 10,
): Promise<PaginatedResponse<TripListItemResponse>> {
  const model = await requestJson<TripCollection>(`/trips?${pageQuery(page, size)}`, {
    method: 'GET',
  })
  return toTripPage(model)
}

export async function findTripsByUserId(
  userId: number,
  page = 1,
  size = 10,
): Promise<PaginatedResponse<TripListItemResponse>> {
  const model = await requestJson<TripCollection>(
    `/trips/search/findByUserId?userId=${userId}&${pageQuery(page, size)}`,
    { method: 'GET' },
  )
  return toTripPage(model)
}

export async function searchTripsByLikedUser(
  userId: number,
  page = 1,
  size = 10,
): Promise<PaginatedResponse<TripListItemResponse>> {
  const model = await requestJson<TripCollection>(
    `/trips/search/findByLikedByUsersId?userId=${userId}&${pageQuery(page, size)}`,
    { method: 'GET' },
  )
  return toTripPage(model)
}

export async function listAllTripsByUserId(userId: number): Promise<TripListItemResponse[]> {
  const firstPage = await findTripsByUserId(userId, 1, 100)
  if (firstPage.totalPages <= 1) return firstPage.items

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      findTripsByUserId(userId, index + 2, firstPage.pageSize || 100),
    ),
  )

  return firstPage.items.concat(remainingPages.flatMap((page) => page.items))
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
