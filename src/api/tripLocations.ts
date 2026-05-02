import type {
  HalEntity,
  LocationResponse,
  SignedImageUploadRequest,
  SignedImageUploadResponse,
  TripLocationImageResponse,
  TripLocationPatchRequest,
  TripLocationResponse,
} from '../types/api'
import { requestJson, requestVoid, uploadFileToSignedUrl } from './client'
import { hrefForResource, idFromEntity, idFromHref } from './hal'

type TripLocationEntityBody = {
  description?: string
  images?: TripLocationImageResponse[]
  signedImageUrls?: string[]
  locationName?: string
  address?: string
  startDate?: string
  endDate?: string
}

function toTripLocation(entity: HalEntity<TripLocationEntityBody>): TripLocationResponse {
  const projectedImages =
    entity.images?.filter(
      (image): image is TripLocationImageResponse =>
        Number.isFinite(image.id) && typeof image.signedReadUrl === 'string' && image.signedReadUrl.length > 0,
    ) ?? []
  return {
    id: idFromEntity(entity),
    tripId: idFromHref(entity._links?.trip?.href),
    locationId: idFromHref(entity._links?.location?.href),
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
    locationName: entity.locationName ?? '',
    address: entity.address,
  }
}

export async function addTripLocation(input: {
  tripId: number
  location: LocationResponse
  description: string
  startDate: string
  endDate: string
}): Promise<TripLocationResponse> {
  const entity = await requestJson<HalEntity<TripLocationEntityBody>>('/trip-locations', {
    method: 'POST',
    body: JSON.stringify({
      trip: hrefForResource(`/trips/${input.tripId}`),
      location: hrefForResource(`/locations/${input.location.id}`),
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
    }),
  })
  return {
    ...toTripLocation(entity),
    locationName: input.location.name,
  }
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
  return { ...toTripLocation(entity), locationName }
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
