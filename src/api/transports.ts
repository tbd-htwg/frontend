import type { HalCollection, HalEntity, TransportResponse } from '../types/api'
import { ApiError, getExists, requestJson, requestVoid } from './client'
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

export async function listTransports(): Promise<TransportResponse[]> {
  const model = await requestJson<TransportCollection>('/transports', { method: 'GET' })
  return embeddedItems(model, 'transports').map(toTransport)
}

/**
 * Audit category A fix: paginated. Empty `type` matches every row (LIKE '%%')
 * so this can be called on focus to prefill a suggestion dropdown;
 * `sort=id,desc` puts the newest transports first (IDENTITY ids preserve
 * insertion order).
 */
const TRANSPORT_SUGGESTION_PAGE_SIZE = 10

export async function searchTransportsByTypeContaining(
  type: string,
  size: number = TRANSPORT_SUGGESTION_PAGE_SIZE,
): Promise<TransportResponse[]> {
  const q = type.trim()
  const params = new URLSearchParams({
    type: q,
    size: String(size),
    sort: 'id,desc',
  })
  try {
    const model = await requestJson<TransportCollection>(
      `/transports/search/findByTypeContainingIgnoreCase?${params.toString()}`,
      { method: 'GET' },
    )
    return embeddedItems(model, 'transports').map(toTransport)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return []
    throw e
  }
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

/**
 * Audit category B fix: append one transport with POST instead of replacing
 * the whole association with a PUT + text/uri-list (which required GET-ing the
 * full current list first and scaled poorly).
 */
export async function addTripTransport(input: {
  tripId: number
  transport: TransportResponse
}): Promise<void> {
  const alreadyLinked = await getExists(
    `/trips/${input.tripId}/transports/${input.transport.id}`,
  )
  if (alreadyLinked) return
  await requestVoid(`/trips/${input.tripId}/transports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: `/transports/${input.transport.id}`,
  })
}

/**
 * Audit category B fix: remove a single member with DELETE on the item URI
 * instead of PUT-replacing the full association.
 */
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
