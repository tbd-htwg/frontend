import type { HalCollection, HalEntity } from '../types/api'
import { requestJson, requestVoid } from './client'
import { embeddedItems, idFromEntity } from './hal'

type TripEntityBody = {
  title?: string
}

type TripCollection = HalCollection<HalEntity<TripEntityBody>>

function toUriList(ids: number[]): string {
  if (ids.length === 0) return ''
  return ids.map((id) => `/trips/${id}`).join('\n')
}

export async function listLikedTripIds(userId: number): Promise<number[]> {
  const model = await requestJson<TripCollection>(`/users/${userId}/likedTrips`, {
    method: 'GET',
  })
  return embeddedItems(model, 'trips')
    .map((trip) => idFromEntity(trip))
    .filter((id) => Number.isFinite(id))
}

export async function likeTrip(userId: number, tripId: number): Promise<void> {
  const current = await listLikedTripIds(userId)
  if (current.includes(tripId)) return
  const next = [...current, tripId]
  await requestVoid(`/users/${userId}/likedTrips`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: toUriList(next),
  })
}

export async function unlikeTrip(userId: number, tripId: number): Promise<void> {
  const current = await listLikedTripIds(userId)
  const next = current.filter((id) => id !== tripId)
  await requestVoid(`/users/${userId}/likedTrips`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: toUriList(next),
  })
}
