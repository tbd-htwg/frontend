import type { AccommodationResponse, HalCollection, HalEntity } from '../types/api'
import { ApiError, getExists, requestJson, requestVoid } from './client'
import { embeddedItems, idFromEntity } from './hal'

type AccommodationEntityBody = {
  type?: string
  name?: string
  address?: string
}

type AccommodationCollection = HalCollection<HalEntity<AccommodationEntityBody>>

function toAccommodation(
  entity: HalEntity<AccommodationEntityBody>,
): AccommodationResponse {
  return {
    id: idFromEntity(entity),
    type: entity.type ?? '',
    name: entity.name ?? '',
    address: entity.address ?? '',
  }
}

export async function listAccommodations(): Promise<AccommodationResponse[]> {
  const model = await requestJson<AccommodationCollection>('/accommodations', {
    method: 'GET',
  })
  const rawItems = [
    ...embeddedItems(model, 'accomEntities'),
    ...embeddedItems(model, 'accommodations'),
  ]
  return rawItems.map(toAccommodation)
}

/**
 * Audit category A fix: the backing repository method is now paginated
 * (`Page<AccomEntity>`), so we request a bounded page instead of the full
 * unbounded list. An empty `name` matches every row, which lets us prefill
 * suggestion dropdowns the moment the user focuses the search field — the
 * `sort=id,desc` ordering surfaces the most recently created accommodations
 * first (IDENTITY ids are monotonically increasing, so id order == insertion
 * order).
 */
const ACCOMMODATION_SUGGESTION_PAGE_SIZE = 10

export async function searchAccommodationsByNameContaining(
  name: string,
  size: number = ACCOMMODATION_SUGGESTION_PAGE_SIZE,
): Promise<AccommodationResponse[]> {
  const q = name.trim()
  const params = new URLSearchParams({
    name: q,
    size: String(size),
    sort: 'id,desc',
  })
  try {
    const model = await requestJson<AccommodationCollection>(
      `/accommodations/search/findByNameContainingIgnoreCase?${params.toString()}`,
      { method: 'GET' },
    )
    const rawItems = [
      ...embeddedItems(model, 'accomEntities'),
      ...embeddedItems(model, 'accommodations'),
    ]
    return rawItems.map(toAccommodation)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return []
    throw e
  }
}

export async function createAccommodation(input: {
  type: string
  name: string
  address: string
}): Promise<AccommodationResponse> {
  const entity = await requestJson<HalEntity<AccommodationEntityBody>>('/accommodations', {
    method: 'POST',
    body: JSON.stringify({
      type: input.type,
      name: input.name,
      address: input.address,
    }),
  })
  return toAccommodation(entity)
}

export async function listTripAccommodationsByTripId(
  tripId: number,
): Promise<AccommodationResponse[]> {
  const model = await requestJson<AccommodationCollection>(
    `/trips/${tripId}/accommodations`,
    {
      method: 'GET',
    },
  )
  const rawItems = [
    ...embeddedItems(model, 'accomEntities'),
    ...embeddedItems(model, 'accommodations'),
  ]
  return rawItems.map(toAccommodation)
}

/**
 * Audit category B fix: append one accommodation with POST instead of
 * replacing the whole association with PUT + text/uri-list.
 */
export async function addTripAccommodation(input: {
  tripId: number
  accommodation: AccommodationResponse
}): Promise<void> {
  const alreadyLinked = await getExists(
    `/trips/${input.tripId}/accommodations/${input.accommodation.id}`,
  )
  if (alreadyLinked) return
  await requestVoid(`/trips/${input.tripId}/accommodations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: `/accommodations/${input.accommodation.id}`,
  })
}

/**
 * Audit category B fix: remove a single accommodation with DELETE on the item
 * URI.
 */
export async function deleteTripAccommodation(
  tripId: number,
  accommodationId: number,
): Promise<void> {
  try {
    await requestVoid(`/trips/${tripId}/accommodations/${accommodationId}`, {
      method: 'DELETE',
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return
    throw err
  }
}
