import type { HalCollection, HalEntity } from '../types/api'
import { ApiError, requestJson, requestVoid } from './client'
import { embeddedItems, idFromEntity } from './hal'

type TripEntityBody = {
  title?: string
}

type TripCollection = HalCollection<HalEntity<TripEntityBody>>

/**
 * Full list of liked trip ids (expensive for users with many likes). Prefer
 * {@link isTripLikedByCurrentUser} when you only need membership for one trip.
 */
export async function listLikedTripIds(userId: number): Promise<number[]> {
  const model = await requestJson<TripCollection>(`/users/${userId}/likedTrips`, {
    method: 'GET',
  })
  return embeddedItems(model, 'trips')
    .map((trip) => idFromEntity(trip))
    .filter((id) => Number.isFinite(id))
}

/**
 * Whether the signed-in user has liked this trip (uses JWT subject).
 * Backend returns 200 + `{ liked: boolean }` so "not liked" is not expressed as HTTP 404.
 */
export async function isTripLikedByCurrentUser(tripId: number): Promise<boolean> {
  const data = await requestJson<{ liked?: boolean }>(
    `/trips/${tripId}/liked-by-current-user`,
    { method: 'GET' },
  )
  return Boolean(data?.liked)
}

/**
 * Append one like without replacing the whole collection (avoids GET+PUT of all likes).
 */
export async function likeTrip(userId: number, tripId: number): Promise<void> {
  if (await isTripLikedByCurrentUser(tripId)) return
  await requestVoid(`/users/${userId}/likedTrips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/uri-list',
    },
    body: `/trips/${tripId}`,
  })
}

export async function unlikeTrip(userId: number, tripId: number): Promise<void> {
  try {
    await requestVoid(`/users/${userId}/likedTrips/${tripId}`, {
      method: 'DELETE',
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return
    throw err
  }
}
