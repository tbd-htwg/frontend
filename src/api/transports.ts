import type { HalCollection, HalEntity, TransportResponse } from '../types/api'
import { ApiError, getExists, requestJson, requestVoid } from './client'
import { embeddedItems, idFromEntity } from './hal'

type TransportEntityBody = {
  startGooglePlaceId?: string
  endGooglePlaceId?: string
  startAddress?: string
  endAddress?: string
  startLatitude?: number
  startLongitude?: number
  endLatitude?: number
  endLongitude?: number
}

type TransportCreatedBody = TransportEntityBody & { id: number }

type TransportCollection = HalCollection<HalEntity<TransportEntityBody>>

function toTransport(
  entity: HalEntity<TransportEntityBody> | TransportCreatedBody,
): TransportResponse {
  const id =
    'id' in entity && typeof (entity as TransportCreatedBody).id === 'number'
      ? (entity as TransportCreatedBody).id
      : idFromEntity(entity as HalEntity<TransportEntityBody>)
  return {
    id,
    startGooglePlaceId: entity.startGooglePlaceId,
    endGooglePlaceId: entity.endGooglePlaceId,
    startAddress: entity.startAddress,
    endAddress: entity.endAddress,
    startLatitude: entity.startLatitude,
    startLongitude: entity.startLongitude,
    endLatitude: entity.endLatitude,
    endLongitude: entity.endLongitude,
  }
}

export async function listTransports(): Promise<TransportResponse[]> {
  const model = await requestJson<TransportCollection>('/transports', { method: 'GET' })
  return embeddedItems(model, 'transports').map(toTransport)
}

export async function createTransport(input: {
  startGooglePlaceId: string
  endGooglePlaceId: string
}): Promise<TransportResponse> {
  const body = await requestJson<TransportCreatedBody>('/transports', {
    method: 'POST',
    body: JSON.stringify({
      startGooglePlaceId: input.startGooglePlaceId,
      endGooglePlaceId: input.endGooglePlaceId,
    }),
  })
  return toTransport(body)
}

export async function updateTransport(
  id: number,
  input: {
    startGooglePlaceId: string
    endGooglePlaceId: string
  },
): Promise<TransportResponse> {
  const body = await requestJson<TransportCreatedBody>(`/transports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      startGooglePlaceId: input.startGooglePlaceId,
      endGooglePlaceId: input.endGooglePlaceId,
    }),
  })
  return toTransport(body)
}

export async function listTripTransportsByTripId(
  tripId: number,
): Promise<TransportResponse[]> {
  const model = await requestJson<TransportCollection>(`/trips/${tripId}/transports`, {
    method: 'GET',
  })
  return embeddedItems(model, 'transports').map(toTransport)
}

export async function addTripTransport(input: {
  tripId: number
  transport: TransportResponse
  /** Skip HEAD pre-check when the transport was just created (avoids noisy 404 in devtools). */
  skipLinkCheck?: boolean
}): Promise<void> {
  if (!input.skipLinkCheck) {
    const alreadyLinked = await getExists(
      `/trips/${input.tripId}/transports/${input.transport.id}`,
    )
    if (alreadyLinked) return
  }
  await requestVoid(`/trips/${input.tripId}/transports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: `/transports/${input.transport.id}`,
  })
}

export async function deleteTripTransport(tripId: number, transportId: number): Promise<void> {
  try {
    await requestVoid(`/trips/${tripId}/transports/${transportId}`, {
      method: 'DELETE',
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return
    throw err
  }
}
