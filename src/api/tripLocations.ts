import type {
  HalEntity,
  SignedImageUploadRequest,
  SignedImageUploadResponse,
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
  locationName?: string
  formattedAddress?: string
  address?: string
  startDate?: string
  endDate?: string
  location?: {
    id?: number
    city?: string
    formattedAddress?: string
  }
  trip?: { id?: number }
}

function toTripLocationFromHal(entity: HalEntity<TripLocationEntityBody>): TripLocationResponse {
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
    formattedAddress: entity.formattedAddress ?? entity.address,
    address: entity.address,
  }
}

function toTripLocationFromCreate(body: TripLocationEntityBody): TripLocationResponse {
  return {
    id: body.id ?? 0,
    tripId: body.trip?.id ?? 0,
    locationId: body.location?.id ?? 0,
    description: body.description ?? '',
    images: [],
    startDate: body.startDate,
    endDate: body.endDate,
    locationName: body.location?.city ?? '',
    address: body.location?.formattedAddress,
  }
}

export async function addTripLocation(input: {
  tripId: number
  city: string
  description: string
  startDate: string
  endDate: string
  formattedAddress?: string
}): Promise<TripLocationResponse> {
  const body = await requestJson<TripLocationEntityBody & { id: number }>('/trip-locations', {
    method: 'POST',
    body: JSON.stringify({
      tripId: input.tripId,
      city: input.city.trim(),
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      formattedAddress: input.formattedAddress,
    }),
  })
  return toTripLocationFromCreate(body)
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
