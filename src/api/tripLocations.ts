import type {
  HalEntity,
  SignedImageUploadRequest,
  SignedImageUploadResponse,
  TripExternalInfoResponse,
  TripLocationImageResponse,
  TripLocationPatchRequest,
  TripLocationResponse,
} from '../types/api'
import { requestJson, requestVoid, uploadFileToSignedUrl } from './client'
import { idFromEntity, idFromHref } from './hal'

type TripLocationEntityBody = {
  id?: number
  description?: string
  images?: TripLocationImageResponse[]
  signedImageUrls?: string[]
  placeName?: string
  cityName?: string
  locationName?: string
  googlePlaceId?: string
  formattedAddress?: string
  address?: string
  startDate?: string
  endDate?: string
  trip?: { id?: number }
}

type TripLocationCreatedBody = {
  id: number
  tripId: number
  googlePlaceId: string
  placeName: string
  cityName: string
  description: string
  startDate?: string
  endDate?: string
}

function toTripLocationFromHal(entity: HalEntity<TripLocationEntityBody>): TripLocationResponse {
  const projectedImages =
    entity.images?.filter(
      (image): image is TripLocationImageResponse =>
        Number.isFinite(image.id) && typeof image.signedReadUrl === 'string' && image.signedReadUrl.length > 0,
    ) ?? []
  const placeName = entity.placeName ?? entity.locationName ?? ''
  const cityName = entity.cityName ?? ''
  return {
    id: idFromEntity(entity),
    tripId: idFromHref(entity._links?.trip?.href),
    locationId: idFromEntity(entity),
    googlePlaceId: entity.googlePlaceId,
    description: entity.description ?? '',
    images:
      projectedImages.length > 0
        ? projectedImages
        : (entity.signedImageUrls ?? []).map((url, index) => ({
            id: -1 - index,
            signedReadUrl: url,
          })),
    startDate: entity.startDate,
    endDate: entity.endDate,
    placeName,
    cityName,
    locationName: placeName,
    formattedAddress: entity.formattedAddress ?? entity.address,
    address: entity.address,
  }
}

function toTripLocationFromCreate(body: TripLocationCreatedBody): TripLocationResponse {
  if (!Number.isFinite(body.id) || body.id <= 0) {
    throw new Error('Server did not return a valid trip location id.')
  }
  return {
    id: body.id,
    tripId: body.tripId,
    locationId: body.id,
    googlePlaceId: body.googlePlaceId,
    description: body.description ?? '',
    images: [],
    startDate: body.startDate,
    endDate: body.endDate,
    placeName: body.placeName,
    cityName: body.cityName,
    locationName: body.placeName,
  }
}

export async function addTripLocation(input: {
  tripId: number
  googlePlaceId: string
  description: string
  startDate: string
  endDate: string
}): Promise<TripLocationResponse> {
  const body = await requestJson<TripLocationCreatedBody>('/trip-locations', {
    method: 'POST',
    body: JSON.stringify({
      tripId: input.tripId,
      googlePlaceId: input.googlePlaceId,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
    }),
  })
  return toTripLocationFromCreate(body)
}

export async function getTripLocationExternalInfo(
  tripLocationId: number,
): Promise<TripExternalInfoResponse> {
  return requestJson<TripExternalInfoResponse>(`/trip-locations/${tripLocationId}/details`)
}

export function deleteTripLocation(id: number): Promise<void> {
  return requestVoid(`/trip-locations/${id}`, { method: 'DELETE' })
}

export async function patchTripLocation(
  id: number,
  body: TripLocationPatchRequest,
  locationName: string,
): Promise<TripLocationResponse> {
  const entity = await requestJson<HalEntity<TripLocationEntityBody>>(`/trip-locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return { ...toTripLocationFromHal(entity), locationName }
}

export function deleteTripLocationImage(tripLocationId: number): Promise<void> {
  return requestVoid(`/trip-locations/${tripLocationId}/images`, { method: 'DELETE' })
}

export function deleteTripLocationImageById(
  tripLocationId: number,
  imageId: number,
): Promise<void> {
  return requestVoid(`/trip-locations/${tripLocationId}/images/${imageId}`, {
    method: 'DELETE',
  })
}

export async function uploadTripLocationImage(
  tripLocationId: number,
  file: File,
): Promise<TripLocationImageResponse> {
  const contentType = file.type?.trim()
  if (!contentType.startsWith('image/')) {
    throw new Error('Only image files are allowed.')
  }
  const signed = await requestJson<SignedImageUploadResponse>(
    `/trip-locations/${tripLocationId}/images`,
    {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        contentType,
      } satisfies SignedImageUploadRequest),
    },
  )
  await uploadFileToSignedUrl(signed.uploadUrl, file, signed.contentType)
  if (!signed.imageId || !Number.isFinite(signed.imageId)) {
    throw new Error('Upload succeeded but no image id was returned by the server.')
  }
  return { id: signed.imageId, signedReadUrl: signed.signedReadUrl }
}
