import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createComment, listCommentsByTripId } from '../api/comments'
import { createLocation, listLocations } from '../api/locations'
import { likeTrip, listLikedTripIds, unlikeTrip } from '../api/likes'
import { addTripLocation, listTripLocationsByTripId } from '../api/tripLocations'
import { countTripLikes, deleteTrip, getTrip, getTripOwner } from '../api/trips'
import { getUserById } from '../api/users'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type {
  CommentResponse,
  LocationResponse,
  TripDetailsResponse,
  TripLocationResponse,
  UserResponse,
} from '../types/api'

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tripId = id ? Number(id) : NaN

  const [trip, setTrip] = useState<TripDetailsResponse | null>(null)
  const [tripOwner, setTripOwner] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likedByMe, setLikedByMe] = useState(false)
  const [liking, setLiking] = useState(false)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [commentText, setCommentText] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [tripLocations, setTripLocations] = useState<TripLocationResponse[]>([])
  const [locations, setLocations] = useState<LocationResponse[]>([])
  const [locationId, setLocationId] = useState('')
  const [newLocationName, setNewLocationName] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [savingLocation, setSavingLocation] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(tripId)) {
      setError('Invalid trip id.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    const load = async () => {
      try {
        const [t, owner, loadedComments, loadedTripLocations, loadedLikeCount] =
          await Promise.all([
            getTrip(tripId),
            getTripOwner(tripId),
            listCommentsByTripId(tripId),
            listTripLocationsByTripId(tripId),
            countTripLikes(tripId),
          ])
        if (cancelled) return
        setTrip(t)
        setTripOwner(owner)
        setComments(loadedComments)
        setTripLocations(loadedTripLocations)
        setLikeCount(loadedLikeCount)
        const allLocations = await listLocations()
        if (!cancelled) {
          setLocations(allLocations)
          if (allLocations.length > 0) {
            setLocationId(String(allLocations[0].id))
          }
        }
        if (user) {
          const [u, likedTrips] = await Promise.all([
            getUserById(user.id),
            listLikedTripIds(user.id),
          ])
          if (cancelled) return
          setIsOwner(u.trips.some((x) => x.id === tripId))
          setLikedByMe(likedTrips.includes(tripId))
        } else {
          setIsOwner(false)
          setLikedByMe(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load this trip.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [tripId, user])

  async function handleDelete() {
    if (!trip || !isOwner) return
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteTrip(trip.id)
      navigate(user ? '/profile' : '/', { replace: true })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggleLike() {
    if (!user || !trip || liking) return
    setLiking(true)
    try {
      if (likedByMe) {
        await unlikeTrip(user.id, trip.id)
      } else {
        await likeTrip(user.id, trip.id)
      }
      const [likedTrips, likes] = await Promise.all([
        listLikedTripIds(user.id),
        countTripLikes(trip.id),
      ])
      setLikedByMe(likedTrips.includes(trip.id))
      setLikeCount(likes)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update like.')
    } finally {
      setLiking(false)
    }
  }

  async function handleCommentSubmit() {
    if (!user || !trip || !commentText.trim()) return
    setCommenting(true)
    try {
      const created = await createComment(trip.id, user.id, commentText.trim())
      setComments((prev) => [
        {
          ...created,
          userId: user.id,
          userName: user.name,
        },
        ...prev,
      ])
      setCommentText('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not add comment.')
    } finally {
      setCommenting(false)
    }
  }

  async function handleAddLocation() {
    if (!trip || !locationDescription.trim()) return
    setSavingLocation(true)
    try {
      let selectedLocation: LocationResponse | undefined
      if (newLocationName.trim()) {
        const createdLocation = await createLocation(newLocationName.trim())
        selectedLocation = createdLocation
        setLocations((prev) => [...prev, createdLocation])
      } else {
        const selectedId = Number(locationId)
        selectedLocation = locations.find((l) => l.id === selectedId)
      }
      if (!selectedLocation) {
        throw new Error('Choose an existing location or enter a new one.')
      }
      const created = await addTripLocation({
        tripId: trip.id,
        location: selectedLocation,
        description: locationDescription.trim(),
      })
      setTripLocations((prev) => [...prev, created])
      setLocationDescription('')
      setNewLocationName('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not add location.')
    } finally {
      setSavingLocation(false)
    }
  }

  if (!Number.isFinite(tripId)) {
    return <p className="text-red-800">Invalid trip.</p>
  }

  return (
    <div>
      {loading && <p className="text-slate-500">Loading…</p>}
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && trip && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{trip.title}</h1>
              <p className="mt-1 text-slate-600">
                {trip.destination} · {formatDate(trip.startDate)}
              </p>
              {tripOwner && Number.isFinite(tripOwner.id) && (
                <p className="mt-1 text-sm text-slate-600">
                  by{' '}
                  <Link to={`/users/${tripOwner.id}`} className="font-medium hover:underline">
                    @{tripOwner.name}
                  </Link>
                </p>
              )}
            </div>
            {isOwner && (
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/trips/${trip.id}/edit`}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          <p className="mt-6 text-sm font-medium text-slate-700">Short description</p>
          <p className="mt-1 text-slate-800">{trip.shortDescription}</p>

          <p className="mt-6 text-sm font-medium text-slate-700">Details</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-800">{trip.longDescription}</p>

          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900">Transport and accommodation</h2>
            <p className="mt-2 text-sm text-slate-600">
              Detailed transport/accommodation editing is prepared in the backend model and
              can be expanded with dedicated frontend forms in a follow-up package.
            </p>
          </section>

          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-slate-900">Locations in this trip</h2>
              <span className="text-sm text-slate-600">{tripLocations.length} entries</span>
            </div>
            {tripLocations.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No locations added yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {tripLocations.map((entry) => (
                  <li key={entry.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <span className="text-lg">🖼️</span>
                      {entry.locationName}
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{entry.description}</p>
                    <button
                      type="button"
                      disabled
                      className="mt-2 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-500"
                    >
                      Upload location image (coming soon)
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {isOwner && (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-sm font-medium text-slate-800">Add location</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Or create new location"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Location description"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleAddLocation()}
                    disabled={savingLocation}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  >
                    {savingLocation ? 'Saving…' : 'Add location'}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-500"
                  >
                    Add image (coming soon)
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-medium text-slate-900">Community</h2>
              <p className="text-sm text-slate-600">{likeCount} likes</p>
            </div>
            <div className="mt-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => void handleToggleLike()}
                  disabled={liking}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 disabled:opacity-50"
                >
                  {liking ? 'Saving…' : likedByMe ? 'Unlike trip' : 'Like trip'}
                </button>
              ) : (
                <p className="text-sm text-slate-600">Log in to like this trip.</p>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-800">Comments</h3>
              {user ? (
                <div className="mt-2 flex flex-col gap-2">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCommentSubmit()}
                    disabled={commenting || !commentText.trim()}
                    className="w-fit rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  >
                    {commenting ? 'Posting…' : 'Post comment'}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Log in to comment on this trip.</p>
              )}

              {comments.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No comments yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {comments.map((comment) => (
                    <li key={comment.id} className="rounded-md border border-slate-200 p-2">
                      <p className="text-sm text-slate-800">{comment.content}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {Number.isFinite(comment.userId) ? (
                          <Link
                            to={`/users/${comment.userId}`}
                            className="font-medium text-slate-600 hover:underline"
                          >
                            @{comment.userName || 'traveller'}
                          </Link>
                        ) : (
                          `@${comment.userName || 'traveller'}`
                        )}{' '}
                        ·{' '}
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <p className="mt-8">
            <Link to="/" className="text-sm font-medium text-slate-700 hover:underline">
              ← Back to all trips
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
