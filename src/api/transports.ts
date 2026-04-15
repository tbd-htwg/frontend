import type { HalCollection, HalEntity, TransportResponse } from '../types/api'
import { requestJson, requestVoid } from './client'
import { embeddedItems, idFromEntity } from './hal'

type TransportEntityBody = {
  type?: string
}

type TransportCollection = HalCollection<HalEntity<TransportEntityBody>>

function toTransport(entity: HalEntity<TransportEntityBody>): TransportResponse {
  return {
    id: idFromEntity(entity),
    type: entity.type ?? '',
  }
}

function toUriList(ids: number[]): string {
  if (ids.length === 0) return ''
  return ids.map((id) => `/transports/${id}`).join('\n')
}

export async function listTransports(): Promise<TransportResponse[]> {
  const model = await requestJson<TransportCollection>('/transports', { method: 'GET' })
  return embeddedItems(model, 'transports').map(toTransport)
}

export async function createTransport(type: string): Promise<TransportResponse> {
  const entity = await requestJson<HalEntity<TransportEntityBody>>('/transports', {
    method: 'POST',
    body: JSON.stringify({ type }),
  })
  return toTransport(entity)
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
}): Promise<void> {
  const current = await listTripTransportsByTripId(input.tripId)
  if (current.some((item) => item.id === input.transport.id)) return
  const nextIds = [...current.map((item) => item.id), input.transport.id]
  await requestVoid(`/trips/${input.tripId}/transports`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: toUriList(nextIds),
  })
}

export async function deleteTripTransport(tripId: number, transportId: number): Promise<void> {
  const current = await listTripTransportsByTripId(tripId)
  const nextIds = current.map((item) => item.id).filter((id) => id !== transportId)
  await requestVoid(`/trips/${tripId}/transports`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: toUriList(nextIds),
  })
}
