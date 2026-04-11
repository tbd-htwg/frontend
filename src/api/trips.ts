import type {
  TripCreateRequest,
  TripDetailsResponse,
  TripListItemResponse,
  TripPatchRequest,
  TripPutRequest,
} from '../types/api'
import { requestJson, requestVoid } from './client'

export function listTrips(): Promise<TripListItemResponse[]> {
  return requestJson<TripListItemResponse[]>('/v1/trips', { method: 'GET' })
}

export function getTrip(id: number): Promise<TripDetailsResponse> {
  return requestJson<TripDetailsResponse>(`/v1/trips/${id}`, { method: 'GET' })
}

export function createTrip(body: TripCreateRequest): Promise<TripDetailsResponse> {
  return requestJson<TripDetailsResponse>('/v1/trips', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function replaceTrip(
  id: number,
  body: TripPutRequest,
): Promise<TripDetailsResponse> {
  return requestJson<TripDetailsResponse>(`/v1/trips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function patchTrip(
  id: number,
  body: TripPatchRequest,
): Promise<TripDetailsResponse> {
  return requestJson<TripDetailsResponse>(`/v1/trips/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteTrip(id: number): Promise<void> {
  return requestVoid(`/v1/trips/${id}`, { method: 'DELETE' })
}
