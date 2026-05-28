import type {
  AccommodationResponse,
  HalEntity,
  PaginatedResponse,
  TransportResponse,
  TripCreateRequest,
  TripDetailsResponse,
  TripListItemResponse,
  TripLocationResponse,
  TripLocationImageResponse,
  TripPatchRequest,
  TripPutRequest,
  TripSearchResult,
} from '../types/api'
import { ApiError, requestJson, requestVoid } from './client'
import { hrefForResource } from './hal'

/**
 * Backend response shape for the feed endpoints under {@code /api/v2/trips/feed*} and
 * {@code /api/v2/trips/{id}/detail}. These are served by the dedicated DTO controllers in
 * {@code com.tripplanning.trip.read} and replace the Spring Data REST {@code ?projection=...}
 * paths whose lazy-association walks were the SQL bottleneck under load.
 */
type TripFeedAuthorDto = {
  id: number;
  name: string;
  profileImageUrl?: string | null;
};

type TripFeedItemDto = {
  id: number;
  title: string;
  destination: string;
  startDate: string;
  shortDescription: string;
  author: TripFeedAuthorDto;
  locations: string[];
  accommodationNames: string[];
  transportRoutes: string[];
};

type TripFeedDetailStopDto = {
  id: number;
  googlePlaceId?: string;
  placeName?: string;
  cityName?: string;
  locationId?: number;
  locationName?: string;
  description: string;
  startDate?: string;
  endDate?: string;
  imageUrls: string[];
  formattedAddress?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  countryCode?: string;
};

type TripFeedAccommodationDto = AccommodationResponse;

type TripFeedTransportDto = TransportResponse;

type TripFeedDetailDto = {
  id: number;
  title: string;
  destination: string;
  destinationGooglePlaceId?: string;
  startDate: string;
  shortDescription: string;
  longDescription: string;
  author: TripFeedAuthorDto;
  stops: TripFeedDetailStopDto[];
  accommodations: TripFeedAccommodationDto[];
  transports: TripFeedTransportDto[];
};

type TripFeedPageDto<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

function toTripSummary(item: TripFeedItemDto): TripListItemResponse {
  return {
    id: item.id,
    title: item.title ?? "",
    destination: item.destination ?? "",
    startDate: item.startDate ?? "",
    shortDescription: item.shortDescription ?? "",
    authorId: item.author?.id,
    userId: item.author?.id,
    ...(item.author?.name ? { authorName: item.author.name } : {}),
    ...(item.author?.profileImageUrl
      ? { authorProfileImageUrl: item.author.profileImageUrl }
      : {}),
    locations: item.locations ?? [],
    accommodationNames: item.accommodationNames ?? [],
    transportRoutes: item.transportRoutes ?? [],
  };
}

function toTripPage(
  payload: TripFeedPageDto<TripFeedItemDto>,
): PaginatedResponse<TripListItemResponse> {
  const items = (payload.items ?? []).map(toTripSummary);
  const size = payload.size > 0 ? payload.size : items.length;
  const totalItems = payload.totalItems ?? items.length;
  return {
    items,
    currentPage: (payload.page ?? 0) + 1,
    pageSize: size,
    totalItems,
    totalPages:
      payload.totalPages ??
      Math.max(1, Math.ceil(totalItems / Math.max(1, size))),
  };
}

function toTripLocation(
  stop: TripFeedDetailStopDto,
  tripId: number,
): TripLocationResponse {
  const placeName = stop.placeName ?? stop.locationName ?? "Unknown location";
  const cityName = stop.cityName ?? "";
  return {
    id: stop.id,
    tripId,
    locationId: stop.locationId ?? stop.id,
    googlePlaceId: stop.googlePlaceId,
    description: stop.description ?? "",
    images: (stop.imageUrls ?? []).map((url, index) => ({
      id: -1 - index,
      signedReadUrl: url,
    })),
    placeName,
    cityName,
    locationName: placeName,
    formattedAddress: stop.formattedAddress ?? stop.address,
    latitude: stop.latitude,
    longitude: stop.longitude,
    countryCode: stop.countryCode,
    startDate: stop.startDate,
    endDate: stop.endDate,
  };
}

function toTripDetails(detail: TripFeedDetailDto): TripDetailsResponse {
  return {
    id: detail.id,
    title: detail.title ?? "",
    destination: detail.destination ?? "",
    ...(detail.destinationGooglePlaceId
      ? { destinationGooglePlaceId: detail.destinationGooglePlaceId }
      : {}),
    startDate: detail.startDate ?? "",
    shortDescription: detail.shortDescription ?? "",
    longDescription: detail.longDescription ?? "",
    authorId: detail.author?.id,
    userId: detail.author?.id,
    ...(detail.author?.name ? { authorName: detail.author.name } : {}),
    ...(detail.author?.profileImageUrl
      ? { authorProfileImageUrl: detail.author.profileImageUrl }
      : {}),
    tripLocations: (detail.stops ?? []).map((stop) =>
      toTripLocation(stop, detail.id),
    ),
    transports: detail.transports ?? [],
    accommodations: detail.accommodations ?? [],
  };
}

function toTripRequest(
  body: TripCreateRequest | TripPutRequest | TripPatchRequest,
) {
  return {
    user: body.userId ? hrefForResource(`/users/${body.userId}`) : undefined,
    title: body.title,
    destination: body.destination,
    destinationGooglePlaceId: body.destinationGooglePlaceId,
    startDate: body.startDate,
    shortDescription: body.shortDescription,
    longDescription: body.longDescription,
  };
}

function feedQuery(page: number, size: number): string {
  const params = new URLSearchParams({
    page: String(Math.max(0, page - 1)),
    size: String(size),
  });
  return params.toString();
}

export async function listTrips(
  page = 1,
  size = 10,
): Promise<PaginatedResponse<TripListItemResponse>> {
  return listTripsFeed("latest", page, size);
}

export async function listTripsFeed(
  mode: "latest" | "recommended" = "latest",
  page = 1,
  size = 10,
): Promise<PaginatedResponse<TripListItemResponse>> {
  const params = new URLSearchParams({
    mode,
    page: String(Math.max(0, page - 1)),
    size: String(size),
  });
  const payload = await requestJson<TripFeedPageDto<TripFeedItemDto>>(
    `/trips/feed?${params.toString()}`,
    { method: "GET" },
    mode === "recommended" ? { forceBearer: true } : undefined,
  );
  return toTripPage(payload);
}

export async function findTripsByUserId(
  userId: number,
  page = 1,
  size = 10,
): Promise<PaginatedResponse<TripListItemResponse>> {
  const payload = await requestJson<TripFeedPageDto<TripFeedItemDto>>(
    `/trips/feed/by-user?userId=${userId}&${feedQuery(page, size)}`,
    { method: "GET" },
  );
  return toTripPage(payload);
}

export async function searchTripsByLikedUser(
  userId: number,
  page = 1,
  size = 10,
): Promise<PaginatedResponse<TripListItemResponse>> {
  const payload = await requestJson<TripFeedPageDto<TripFeedItemDto>>(
    `/trips/feed/liked-by?userId=${userId}&${feedQuery(page, size)}`,
    { method: "GET" },
  );
  return toTripPage(payload);
}

type SpringPageTripSearchDto = {
  content?: TripSearchResult[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

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
  });
  const raw = await requestJson<SpringPageTripSearchDto>(
    `/api/search/trips?${params}`,
    {
      method: "GET",
    },
  );
  const items = raw.content ?? [];
  const totalPages = Math.max(1, raw.totalPages ?? 1);
  return {
    items,
    currentPage: (raw.number ?? 0) + 1,
    pageSize: raw.size ?? size,
    totalItems: raw.totalElements ?? items.length,
    totalPages,
  };
}

/**
 * Authenticated second-stage fetch for trip-detail stop images (id + signed URL). The public
 * {@code GET /trips/{id}/detail} response omits signed URLs when no Bearer token is sent.
 */
export async function fetchTripDetailLocationImages(
  tripId: number,
): Promise<Record<number, TripLocationImageResponse[]>> {
  const raw = await requestJson<Record<string, TripLocationImageResponse[]>>(
    `/trips/${tripId}/trip-location-image-urls`,
    { method: "GET" },
  );
  const out: Record<number, TripLocationImageResponse[]> = {};
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    const id = Number(k);
    if (!Number.isFinite(id) || !Array.isArray(v)) continue;
    out[id] = v.filter(
      (image): image is TripLocationImageResponse =>
        Number.isFinite(image.id) &&
        typeof image.signedReadUrl === "string" &&
        image.signedReadUrl.length > 0,
    );
  }
  return out;
}

/** @deprecated Use {@link fetchTripDetailLocationImages}. */
export async function fetchTripDetailLocationImageUrls(
  tripId: number,
): Promise<Record<number, string[]>> {
  const imagesByStop = await fetchTripDetailLocationImages(tripId);
  const out: Record<number, string[]> = {};
  for (const [stopId, images] of Object.entries(imagesByStop)) {
    out[Number(stopId)] = images.map((image) => image.signedReadUrl);
  }
  return out;
}

export type FetchFeedLocationImagesOptions = {
  /** First flattened carousel index per trip (0-based). */
  startIndex?: number;
  /** Max signed URLs per trip from {@code startIndex}; omit for all remaining images. */
  perTripLimit?: number;
};

export async function fetchFeedLocationImageUrls(
  tripIds: number[],
  options?: FetchFeedLocationImagesOptions,
): Promise<Record<number, string[]>> {
  if (tripIds.length === 0) return {};
  const params = new URLSearchParams();
  for (const id of tripIds) params.append("tripId", String(id));
  if (options?.startIndex != null)
    params.set("startIndex", String(options.startIndex));
  if (options?.perTripLimit != null)
    params.set("perTripLimit", String(options.perTripLimit));
  const raw = await requestJson<Record<string, string[]>>(
    `/trips/feed-location-images?${params}`,
    {
      method: "GET",
    },
  );
  const out: Record<number, string[]> = {};
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    const id = Number(k);
    if (Number.isFinite(id) && Array.isArray(v)) out[id] = v;
  }
  return out;
}

export function countTripLikes(tripId: number): Promise<number> {
  return requestJson<number>(`/trips/search/countLikes?tripId=${tripId}`, {
    method: "GET",
  });
}

export async function getTrip(id: number): Promise<TripDetailsResponse> {
  const detail = await requestJson<TripFeedDetailDto>(`/trips/${id}/detail`, {
    method: "GET",
  });
  return toTripDetails(detail);
}

type TripEntityBody = {
  id?: number;
  title?: string;
  destination?: string;
  destinationGooglePlaceId?: string;
  startDate?: string;
  shortDescription?: string;
  longDescription?: string;
};

function idFromHalEntity(entity: HalEntity<TripEntityBody>): number {
  if (Number.isFinite(entity.id)) return entity.id as number;
  const href = entity._links?.self?.href ?? "";
  const last = href.split("?")[0].split("/").filter(Boolean).at(-1);
  const parsed = last ? Number(last) : NaN;
  return Number.isFinite(parsed) ? parsed : NaN;
}

/**
 * Create returns a minimal {@link TripDetailsResponse} so the existing form callers can read
 * {@code created.id} for navigation. We deliberately avoid a follow-up {@code /detail} call
 * here since the caller has the form values already and only consumes the id.
 */
export async function createTrip(
  body: TripCreateRequest,
): Promise<TripDetailsResponse> {
  const entity = await requestJson<HalEntity<TripEntityBody>>("/trips", {
    method: "POST",
    body: JSON.stringify(toTripRequest(body)),
  });
  return summarizeTripEntity(entity, body);
}

export async function replaceTrip(
  id: number,
  body: TripPutRequest,
): Promise<TripDetailsResponse> {
  const entity = await requestJson<HalEntity<TripEntityBody>>(`/trips/${id}`, {
    method: "PUT",
    body: JSON.stringify(toTripRequest(body)),
  });
  return summarizeTripEntity(entity, body);
}

export async function patchTrip(
  id: number,
  body: TripPatchRequest,
): Promise<TripDetailsResponse> {
  const entity = await requestJson<HalEntity<TripEntityBody>>(`/trips/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toTripRequest(body)),
  });
  return summarizeTripEntity(entity, body);
}

export async function deleteTrip(id: number): Promise<void> {
  try {
    await requestVoid(`/trips/${id}`, { method: 'DELETE' })
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return
    if (err instanceof ApiError && err.status === 500) {
      try {
        await requestJson<unknown>(`/trips/${id}/detail`, { method: 'GET' })
      } catch (checkErr) {
        if (checkErr instanceof ApiError && checkErr.status === 404) return
      }
    }
    throw err
  }
}

function summarizeTripEntity(
  entity: HalEntity<TripEntityBody>,
  body: TripCreateRequest | TripPutRequest | TripPatchRequest,
): TripDetailsResponse {
  return {
    id: idFromHalEntity(entity),
    title: entity.title ?? body.title ?? "",
    destination: entity.destination ?? "",
    ...((entity.destinationGooglePlaceId ?? body.destinationGooglePlaceId)
      ? {
          destinationGooglePlaceId:
            entity.destinationGooglePlaceId ?? body.destinationGooglePlaceId,
        }
      : {}),
    startDate: entity.startDate ?? body.startDate ?? "",
    shortDescription: entity.shortDescription ?? body.shortDescription ?? "",
    longDescription: entity.longDescription ?? body.longDescription ?? "",
    ...(body.userId ? { authorId: body.userId, userId: body.userId } : {}),
    tripLocations: [],
    transports: [],
    accommodations: [],
  };
}
