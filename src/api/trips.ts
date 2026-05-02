import type {
  HalCollection,
  HalEntity,
  PaginatedResponse,
  TripCreateRequest,
  TripDetailsResponse,
  TripListItemResponse,
  TripLocationResponse,
  TripPatchRequest,
  TripPutRequest,
  TripSearchResult,
  UserResponse,
} from '../types/api'
import { requestJson, requestVoid } from './client'
import { hrefForResource, idFromEntity, idFromHref, paginatedItems } from './hal'

type TripEntityBody = {
  title?: string
  destination?: string
  startDate?: string
  shortDescription?: string
  longDescription?: string
  authorId?: number
  authorName?: string
  authorProfileImageUrl?: string
  locations?: string[]
  accommodationNames?: string[]
  transportTypes?: string[]
  locationImageUrls?: string[]
  tripLocations?: TripDetailsResponse['tripLocations']
  transports?: TripDetailsResponse['transports']
  accommodations?: TripDetailsResponse['accommodations']
}

function toTripSummary(entity: HalEntity<TripEntityBody>): TripListItemResponse {
  const userIdRaw = idFromHref(entity._links?.user?.href)
  const authorIdRaw = entity.authorId ?? userIdRaw
  return {
    id: idFromEntity(entity),
    title: entity.title ?? '',
    destination: entity.destination ?? '',
    startDate: entity.startDate ?? '',
    shortDescription: entity.shortDescription ?? '',
    ...(Number.isFinite(authorIdRaw) ? { authorId: authorIdRaw } : {}),
    ...(Number.isFinite(authorIdRaw) ? { userId: authorIdRaw } : {}),
    ...(entity.authorName ? { authorName: entity.authorName } : {}),
    ...(entity.authorProfileImageUrl
      ? { authorProfileImageUrl: entity.authorProfileImageUrl }
      : {}),
    ...(entity.locations ? { locations: entity.locations } : {}),
    ...(entity.accommodationNames ? { accommodationNames: entity.accommodationNames } : {}),
    ...(entity.transportTypes ? { transportTypes: entity.transportTypes } : {}),
    ...(entity.locationImageUrls?.length
      ? { locationImageUrls: entity.locationImageUrls }
      : {}),
  }
}

function toTripDetails(entity: HalEntity<TripEntityBody>): TripDetailsResponse {
  return {
    ...toTripSummary(entity),
    longDescription: entity.longDescription ?? '',
    tripLocations: entity.tripLocations ?? [],
    transports: entity.transports ?? [],
    accommodations: entity.accommodations ?? [],
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
  const model = await requestJson<TripCollection>(
    `/trips?${pageQuery(page, size)}&projection=list`,
    {
      method: 'GET',
    },
  )
  return toTripPage(model)
}

export async function findTripsByUserId(
  userId: number,
  page = 1,
  size = 10,
): Promise<PaginatedResponse<TripListItemResponse>> {
  const model = await requestJson<TripCollection>(
    `/trips/search/findByUserId?userId=${userId}&${pageQuery(page, size)}&projection=list`,
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
    `/trips/search/findByLikedByUsersId?userId=${userId}&${pageQuery(page, size)}&projection=list`,
    { method: 'GET' },
  )
  return toTripPage(model)
}

type SpringPageTripSearchDto = {
  content?: TripSearchResult[]
  totalElements?: number
  totalPages?: number
  number?: number
  size?: number
}

/** Full-text search (Hibernate Search). `page` is 1-based (same as listTrips). */
export async function searchTrips(
  q: string,
  page = 1,
  size = 10,
): Promise<PaginatedResponse<TripSearchResult>> {
  const params = new URLSearchParams({
    q: q.trim(),
    page: String(Math.max(0, page - 1)),
    size: String(size),
  })
  const raw = await requestJson<SpringPageTripSearchDto>(`/api/search/trips?${params}`, {
    method: 'GET',
  })
  const items = raw.content ?? []
  const totalPages = Math.max(1, raw.totalPages ?? 1)
  return {
    items,
    currentPage: (raw.number ?? 0) + 1,
    pageSize: raw.size ?? size,
    totalItems: raw.totalElements ?? items.length,
    totalPages,
  }
}

/** Batch signed URLs for feed carousels (after fast {@link listTrips} / {@link searchTrips}). */
/** Merge second-stage signed URLs from {@link fetchTripDetailLocationImageUrls} into trip stops. */
export function mergeTripDetailLocationImageUrls(
  locations: TripLocationResponse[],
  urlsByStopId: Record<number, string[]>,
): TripLocationResponse[] {
  return locations.map((loc) => {
    const base: TripLocationResponse = {
      ...loc,
      images: loc.images ?? [],
    }
    const urls = urlsByStopId[loc.id]
    if (!urls?.length) return base
    return {
      ...base,
      images: urls.map((signedReadUrl, index) => ({
        id: -1 - index,
        signedReadUrl,
      })),
    }
  })
}

/** Signed URLs per trip-location id (authenticated clients only; anonymous gets empty strings omitted). */
export async function fetchTripDetailLocationImageUrls(
  tripId: number,
): Promise<Record<number, string[]>> {
  const raw = await requestJson<Record<string, string[]>>(
    `/trips/${tripId}/trip-location-image-urls`,
    { method: 'GET' },
  )
  const out: Record<number, string[]> = {}
  if (!raw) return out
  for (const [k, v] of Object.entries(raw)) {
    const id = Number(k)
    if (Number.isFinite(id) && Array.isArray(v)) out[id] = v
  }
  return out
}

export async function fetchFeedLocationImageUrls(
  tripIds: number[],
): Promise<Record<number, string[]>> {
  if (tripIds.length === 0) return {}
  const params = new URLSearchParams()
  for (const id of tripIds) params.append('tripId', String(id))
  const raw = await requestJson<Record<string, string[]>>(`/trips/feed-location-images?${params}`, {
    method: 'GET',
  })
  const out: Record<number, string[]> = {}
  if (!raw) return out
  for (const [k, v] of Object.entries(raw)) {
    const id = Number(k)
    if (Number.isFinite(id) && Array.isArray(v)) out[id] = v
  }
  return out
}

export function countTripLikes(tripId: number): Promise<number> {
  return requestJson<number>(`/trips/search/countLikes?tripId=${tripId}`, { method: 'GET' })
}

export async function getTripOwner(tripId: number): Promise<UserResponse> {
  const entity = await requestJson<
    HalEntity<{ email?: string; name?: string; profileImageUrl?: string; description?: string }>
  >(`/trips/${tripId}/user?projection=public`, { method: 'GET' })
  return {
    id: idFromEntity(entity),
    email: entity.email ?? '',
    name: entity.name ?? '',
    imageUrl: entity.profileImageUrl ?? '',
    description: entity.description ?? '',
  }
}

export async function getTrip(id: number): Promise<TripDetailsResponse> {
  const entity = await requestJson<HalEntity<TripEntityBody>>(
    `/trips/${id}?projection=fullDetailFast`,
    {
      method: 'GET',
    },
  )
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
