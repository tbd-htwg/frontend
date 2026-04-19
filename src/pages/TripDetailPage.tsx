import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComment,
  faGear,
  faHeart,
  faHotel,
  faImage,
  faMinus,
  faPenToSquare,
  faPersonWalkingLuggage,
  faPlus,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import {
  addTripAccommodation,
  createAccommodation,
  deleteTripAccommodation,
  listTripAccommodationsByTripId,
  searchAccommodationsByNameContaining,
} from '../api/accommodations'
import { createComment, listCommentsByTripId } from '../api/comments'
import { createLocation, searchLocationsByNameContaining } from '../api/locations'
import { likeTrip, listLikedTripIds, unlikeTrip } from '../api/likes'
import {
  addTripTransport,
  createTransport,
  deleteTripTransport,
  listTripTransportsByTripId,
  searchTransportsByTypeContaining,
} from '../api/transports'
import {
  addTripLocation,
  deleteTripLocation,
  listTripLocationsByTripId,
} from '../api/tripLocations'
import { countTripLikes, deleteTrip, getTrip, getTripOwner } from '../api/trips'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type {
  AccommodationResponse,
  CommentResponse,
  LocationResponse,
  TransportResponse,
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

function mergeById<T extends { id: number }>(...lists: T[][]): T[] {
  const m = new Map<number, T>()
  for (const list of lists) {
    for (const x of list) m.set(x.id, x)
  }
  return [...m.values()]
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
  const [showTripManagement, setShowTripManagement] = useState(false)
  const [showTransportAddPanel, setShowTransportAddPanel] = useState(false)
  const [showAccommodationAddPanel, setShowAccommodationAddPanel] = useState(false)
  const [showLocationAddPanel, setShowLocationAddPanel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likedByMe, setLikedByMe] = useState(false)
  const [liking, setLiking] = useState(false)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [commentText, setCommentText] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [tripLocations, setTripLocations] = useState<TripLocationResponse[]>([])
  /** Locations created in this session (add-new flow); search fills suggestions via API. */
  const [locations, setLocations] = useState<LocationResponse[]>([])
  const [tripTransports, setTripTransports] = useState<TransportResponse[]>([])
  /** Transports created in this session; search fills suggestions via API. */
  const [sessionTransports, setSessionTransports] = useState<TransportResponse[]>([])
  const [transportSearch, setTransportSearch] = useState('')
  const [selectedExistingTransport, setSelectedExistingTransport] =
    useState<TransportResponse | null>(null)
  const [showTransportSuggestions, setShowTransportSuggestions] = useState(false)
  const [transportMode, setTransportMode] = useState<'existing' | 'new'>('existing')
  const [newTransportType, setNewTransportType] = useState('')
  const [savingTransport, setSavingTransport] = useState(false)
  const [removingTransportId, setRemovingTransportId] = useState<number | null>(null)
  const [tripAccommodations, setTripAccommodations] = useState<AccommodationResponse[]>([])
  /** Accommodations created in this session; search fills suggestions via API. */
  const [sessionAccommodations, setSessionAccommodations] = useState<AccommodationResponse[]>([])
  const [accommodationApiHits, setAccommodationApiHits] = useState<AccommodationResponse[]>([])
  const [locationApiHits, setLocationApiHits] = useState<LocationResponse[]>([])
  const [transportApiHits, setTransportApiHits] = useState<TransportResponse[]>([])
  const [accommodationSearch, setAccommodationSearch] = useState('')
  const [selectedExistingAccommodation, setSelectedExistingAccommodation] =
    useState<AccommodationResponse | null>(null)
  const [showAccommodationSuggestions, setShowAccommodationSuggestions] =
    useState(false)
  const [accommodationMode, setAccommodationMode] =
    useState<'existing' | 'new'>('existing')
  const [newAccommodationName, setNewAccommodationName] = useState('')
  const [newAccommodationType, setNewAccommodationType] = useState('')
  const [newAccommodationAddress, setNewAccommodationAddress] = useState('')
  const [savingAccommodation, setSavingAccommodation] = useState(false)
  const [removingAccommodationId, setRemovingAccommodationId] = useState<number | null>(
    null,
  )
  const [locationSearch, setLocationSearch] = useState('')
  const [selectedExistingLocation, setSelectedExistingLocation] =
    useState<LocationResponse | null>(null)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [locationMode, setLocationMode] = useState<'existing' | 'new'>('existing')
  const [newLocationName, setNewLocationName] = useState('')
  const [existingLocationDescription, setExistingLocationDescription] = useState('')
  const [newLocationDescription, setNewLocationDescription] = useState('')
  const [savingLocation, setSavingLocation] = useState(false)
  const [removingLocationId, setRemovingLocationId] = useState<number | null>(null)

  const debouncedAccommodationSearch = useDebouncedValue(accommodationSearch, 300)
  const debouncedLocationSearch = useDebouncedValue(locationSearch, 300)
  const debouncedTransportSearch = useDebouncedValue(transportSearch, 300)

  useEffect(() => {
    const q = debouncedAccommodationSearch.trim()
    if (!q) {
      setAccommodationApiHits([])
      return
    }
    let cancelled = false
    searchAccommodationsByNameContaining(q)
      .then((hits) => {
        if (!cancelled) setAccommodationApiHits(hits)
      })
      .catch(() => {
        if (!cancelled) setAccommodationApiHits([])
      })
    return () => {
      cancelled = true
    }
  }, [debouncedAccommodationSearch])

  useEffect(() => {
    const q = debouncedLocationSearch.trim()
    if (!q) {
      setLocationApiHits([])
      return
    }
    let cancelled = false
    searchLocationsByNameContaining(q)
      .then((hits) => {
        if (!cancelled) setLocationApiHits(hits)
      })
      .catch(() => {
        if (!cancelled) setLocationApiHits([])
      })
    return () => {
      cancelled = true
    }
  }, [debouncedLocationSearch])

  useEffect(() => {
    const q = debouncedTransportSearch.trim()
    if (!q) {
      setTransportApiHits([])
      return
    }
    let cancelled = false
    searchTransportsByTypeContaining(q)
      .then((hits) => {
        if (!cancelled) setTransportApiHits(hits)
      })
      .catch(() => {
        if (!cancelled) setTransportApiHits([])
      })
    return () => {
      cancelled = true
    }
  }, [debouncedTransportSearch])

  const locationSuggestions = useMemo(() => {
    const q = locationSearch.trim().toLowerCase()
    const local = q
      ? locations.filter((l) => l.name.toLowerCase().includes(q))
      : []
    return mergeById(locationApiHits, local)
  }, [locationApiHits, locations, locationSearch])

  const transportSuggestions = useMemo(() => {
    const q = transportSearch.trim().toLowerCase()
    const local = q
      ? sessionTransports.filter((t) => t.type.toLowerCase().includes(q))
      : []
    return mergeById(transportApiHits, local)
  }, [transportApiHits, sessionTransports, transportSearch])

  const accommodationSuggestions = useMemo(() => {
    const q = accommodationSearch.trim().toLowerCase()
    const local = q
      ? sessionAccommodations.filter((a) =>
          `${a.name} ${a.type} ${a.address}`.toLowerCase().includes(q),
        )
      : []
    return mergeById(accommodationApiHits, local)
  }, [accommodationApiHits, sessionAccommodations, accommodationSearch])

  useEffect(() => {
    const q = accommodationSearch.trim().toLowerCase()
    if (!q) {
      setSelectedExistingAccommodation(null)
      return
    }
    const canonicalLabel = (a: AccommodationResponse) =>
      `${a.name} (${a.type})`.toLowerCase()
    const match = accommodationSuggestions.find((a) => canonicalLabel(a) === q)
    if (match) {
      setSelectedExistingAccommodation(match)
      return
    }
    setSelectedExistingAccommodation((prev) => {
      if (prev && canonicalLabel(prev) === q) {
        return prev
      }
      return null
    })
  }, [accommodationSearch, accommodationSuggestions])

  useEffect(() => {
    const q = locationSearch.trim().toLowerCase()
    if (!q) {
      setSelectedExistingLocation(null)
      return
    }
    const match = locationSuggestions.find((l) => l.name.toLowerCase() === q)
    setSelectedExistingLocation(match ?? null)
  }, [locationSearch, locationSuggestions])

  useEffect(() => {
    const q = transportSearch.trim().toLowerCase()
    if (!q) {
      setSelectedExistingTransport(null)
      return
    }
    const match = transportSuggestions.find((t) => t.type.toLowerCase() === q)
    setSelectedExistingTransport(match ?? null)
  }, [transportSearch, transportSuggestions])

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
        const [loadedTripTransports, loadedTripAccommodations] = await Promise.allSettled([
          listTripTransportsByTripId(tripId),
          listTripAccommodationsByTripId(tripId),
        ])
        if (!cancelled) {
          setTripTransports(
            loadedTripTransports.status === 'fulfilled' ? loadedTripTransports.value : [],
          )
          setTripAccommodations(
            loadedTripAccommodations.status === 'fulfilled'
              ? loadedTripAccommodations.value
              : [],
          )
        }
        if (user) {
          const likedTrips = await listLikedTripIds(user.id)
          if (cancelled) return
          setIsOwner(owner.id === user.id)
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

  useEffect(() => {
    setShowTripManagement(false)
    setShowTransportAddPanel(false)
    setShowAccommodationAddPanel(false)
    setShowLocationAddPanel(false)
  }, [tripId])

  useEffect(() => {
    if (!showTripManagement) {
      setShowTransportAddPanel(false)
      setShowAccommodationAddPanel(false)
      setShowLocationAddPanel(false)
    }
  }, [showTripManagement])

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

  async function handleAddExistingLocation() {
    if (!trip || !existingLocationDescription.trim()) return
    setSavingLocation(true)
    try {
      const selectedLocation = selectedExistingLocation
      if (!selectedLocation) {
        throw new Error('Choose an existing location first.')
      }
      const created = await addTripLocation({
        tripId: trip.id,
        location: selectedLocation,
        description: existingLocationDescription.trim(),
      })
      setTripLocations((prev) => [...prev, created])
      setExistingLocationDescription('')
      setLocationSearch('')
      setSelectedExistingLocation(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not add existing location.')
    } finally {
      setSavingLocation(false)
    }
  }

  async function handleCreateAndAddLocation() {
    if (!trip || !newLocationName.trim() || !newLocationDescription.trim()) return
    setSavingLocation(true)
    try {
      const createdLocation = await createLocation(newLocationName.trim())
      setLocations((prev) => [...prev, createdLocation])
      const created = await addTripLocation({
        tripId: trip.id,
        location: createdLocation,
        description: newLocationDescription.trim(),
      })
      setTripLocations((prev) => [...prev, created])
      setNewLocationName('')
      setNewLocationDescription('')
      setLocationMode('existing')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create and add location.')
    } finally {
      setSavingLocation(false)
    }
  }

  async function handleRemoveLocation(entryId: number) {
    if (!isOwner) return
    if (!window.confirm('Remove this location from the trip?')) return
    setRemovingLocationId(entryId)
    try {
      await deleteTripLocation(entryId)
      setTripLocations((prev) => prev.filter((entry) => entry.id !== entryId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove location.')
    } finally {
      setRemovingLocationId(null)
    }
  }

  async function handleAddExistingTransport() {
    if (!trip || !selectedExistingTransport) return
    setSavingTransport(true)
    try {
      await addTripTransport({
        tripId: trip.id,
        transport: selectedExistingTransport,
      })
      setTripTransports((prev) => {
        if (prev.some((item) => item.id === selectedExistingTransport.id)) return prev
        return [...prev, selectedExistingTransport]
      })
      setTransportSearch('')
      setSelectedExistingTransport(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not add transport.')
    } finally {
      setSavingTransport(false)
    }
  }

  async function handleCreateAndAddTransport() {
    if (!trip || !newTransportType.trim()) return
    setSavingTransport(true)
    try {
      const createdTransport = await createTransport(newTransportType.trim())
      setSessionTransports((prev) => [...prev, createdTransport])
      await addTripTransport({
        tripId: trip.id,
        transport: createdTransport,
      })
      setTripTransports((prev) => [...prev, createdTransport])
      setNewTransportType('')
      setTransportMode('existing')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create and add transport.')
    } finally {
      setSavingTransport(false)
    }
  }

  async function handleRemoveTransport(transportId: number) {
    if (!trip || !isOwner) return
    if (!window.confirm('Remove this transport from the trip?')) return
    setRemovingTransportId(transportId)
    try {
      await deleteTripTransport(trip.id, transportId)
      setTripTransports((prev) => prev.filter((item) => item.id !== transportId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove transport.')
    } finally {
      setRemovingTransportId(null)
    }
  }

  async function handleAddExistingAccommodation() {
    if (!trip || !selectedExistingAccommodation) return
    setSavingAccommodation(true)
    try {
      await addTripAccommodation({
        tripId: trip.id,
        accommodation: selectedExistingAccommodation,
      })
      setTripAccommodations((prev) => {
        if (prev.some((item) => item.id === selectedExistingAccommodation.id)) return prev
        return [...prev, selectedExistingAccommodation]
      })
      setAccommodationSearch('')
      setSelectedExistingAccommodation(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not add accommodation.')
    } finally {
      setSavingAccommodation(false)
    }
  }

  async function handleCreateAndAddAccommodation() {
    if (
      !trip ||
      !newAccommodationName.trim() ||
      !newAccommodationType.trim() ||
      !newAccommodationAddress.trim()
    ) {
      return
    }
    setSavingAccommodation(true)
    try {
      const createdAccommodation = await createAccommodation({
        name: newAccommodationName.trim(),
        type: newAccommodationType.trim(),
        address: newAccommodationAddress.trim(),
      })
      setSessionAccommodations((prev) => [...prev, createdAccommodation])
      await addTripAccommodation({
        tripId: trip.id,
        accommodation: createdAccommodation,
      })
      setTripAccommodations((prev) => [...prev, createdAccommodation])
      setNewAccommodationName('')
      setNewAccommodationType('')
      setNewAccommodationAddress('')
      setAccommodationMode('existing')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create and add accommodation.')
    } finally {
      setSavingAccommodation(false)
    }
  }

  async function handleRemoveAccommodation(accommodationId: number) {
    if (!trip || !isOwner) return
    if (!window.confirm('Remove this accommodation from the trip?')) return
    setRemovingAccommodationId(accommodationId)
    try {
      await deleteTripAccommodation(trip.id, accommodationId)
      setTripAccommodations((prev) => prev.filter((item) => item.id !== accommodationId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove accommodation.')
    } finally {
      setRemovingAccommodationId(null)
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
                  <Link
                    to={`/users/${tripOwner.id}`}
                    aria-label={`Open profile of ${tripOwner.name}`}
                    className="font-medium hover:underline"
                  >
                    @{tripOwner.name}
                  </Link>
                </p>
              )}
            </div>
            {isOwner && showTripManagement && (
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/trips/${trip.id}/edit`}
                  aria-label="Edit this trip"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  aria-label={deleting ? 'Deleting this trip' : 'Delete this trip'}
                  className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          {isOwner && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <FontAwesomeIcon
                icon={faUser}
                className="shrink-0 text-slate-600"
                aria-hidden="true"
              />
              <p>This is your trip.</p>
              <button
                type="button"
                onClick={() => setShowTripManagement((prev) => !prev)}
                aria-label={
                  showTripManagement ? 'Hide trip management controls' : 'Show trip management controls'
                }
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                <FontAwesomeIcon icon={faGear} aria-hidden="true" />
                {showTripManagement ? 'Hide management' : 'Manage trip'}
              </button>
            </div>
          )}

          <p className="mt-6 text-sm font-medium text-slate-700">Short description</p>
          <p className="mt-1 text-slate-800">{trip.shortDescription}</p>

          <p className="mt-6 text-sm font-medium text-slate-700">Details</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-800">{trip.longDescription}</p>

          <section className="mt-8">

            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-medium text-slate-900">Locations in this trip</h2>
              <span className="text-sm text-slate-600">{tripLocations.length} entries</span>
            </div>
            {tripLocations.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No locations added yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {tripLocations.map((entry) => (
                  <li key={entry.id} className="rounded-md border border-slate-300 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <FontAwesomeIcon icon={faImage} aria-label="Location image placeholder" />
                          {entry.locationName}
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{entry.description}</p>
                        <button
                          type="button"
                          disabled
                          aria-label="Upload location image coming soon"
                          className="mt-2 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-500"
                        >
                          Upload location image (coming soon)
                        </button>
                      </div>
                      {isOwner && showTripManagement && (
                        <button
                          type="button"
                          onClick={() => void handleRemoveLocation(entry.id)}
                          disabled={removingLocationId === entry.id}
                          aria-label={`Remove location ${entry.locationName}`}
                          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                        >
                          {removingLocationId === entry.id ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {isOwner && showTripManagement && (
              <div className="mt-4 rounded-md border border-slate-300 bg-slate-100 p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-slate-800">Add location</h3>
                    <p className="mt-1 text-xs text-slate-600">
                      Choose an existing location or create a new one.
                    </p>
                  </div>
                  {tripLocations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowLocationAddPanel((prev) => !prev)}
                      aria-expanded={showLocationAddPanel}
                      aria-label={
                        showLocationAddPanel
                          ? 'Collapse add or create location'
                          : 'Expand add or create location'
                      }
                      className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50"
                    >
                      <FontAwesomeIcon
                        icon={showLocationAddPanel ? faMinus : faPlus}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
                {(tripLocations.length === 0 || showLocationAddPanel) && (
                  <>
                <div className="my-4 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setLocationMode((prev) =>
                        prev === 'existing' ? 'new' : 'existing',
                      )
                    }
                    aria-label={
                      locationMode === 'existing'
                        ? 'Switch to create new location'
                        : 'Switch to add existing location'
                    }
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {locationMode === 'existing'
                      ? 'Switch to create new location'
                      : 'Switch to add existing location'}
                  </button>
                </div>

                {locationMode === 'existing' ? (
                  <div className="rounded-md border border-slate-300 bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Add existing location
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <div className="relative">
                        <input
                          placeholder="Search locations"
                          aria-label="Search existing locations"
                          value={locationSearch}
                          onFocus={() => setShowLocationSuggestions(true)}
                          onBlur={() => {
                            setTimeout(() => setShowLocationSuggestions(false), 100)
                          }}
                          onChange={(e) => {
                            const nextSearch = e.target.value
                            setLocationSearch(nextSearch)
                            setShowLocationSuggestions(true)
                          }}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        {showLocationSuggestions && locationSuggestions.length > 0 && (
                          <ul className="absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-slate-300 bg-white shadow">
                            {locationSuggestions.map((l) => (
                              <li key={l.id}>
                                <button
                                  type="button"
                                  aria-label={`Select location ${l.name}`}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                                  onMouseDown={() => {
                                    setSelectedExistingLocation(l)
                                    setLocationSearch(l.name)
                                    setShowLocationSuggestions(false)
                                  }}
                                >
                                  {l.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAddExistingLocation()}
                        disabled={
                          savingLocation ||
                          !selectedExistingLocation ||
                          !existingLocationDescription.trim()
                        }
                        aria-label={savingLocation ? 'Adding selected location' : 'Add selected location'}
                        className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        {savingLocation ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="How was it there? Share a quick impression."
                      aria-label="Description for selected location"
                      value={existingLocationDescription}
                      onChange={(e) => setExistingLocationDescription(e.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        disabled
                        aria-label="Add location image coming soon"
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-500"
                      >
                        Add image (coming soon)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-slate-300 bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Create and add new location
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        placeholder="New location name"
                        aria-label="New location name"
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void handleCreateAndAddLocation()}
                        disabled={
                          savingLocation ||
                          !newLocationName.trim() ||
                          !newLocationDescription.trim()
                        }
                        aria-label={savingLocation ? 'Saving new location' : 'Create and add location'}
                        className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        {savingLocation ? 'Saving…' : 'Create and add'}
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="How was it there? Share a quick impression."
                      aria-label="Description for new location"
                      value={newLocationDescription}
                      onChange={(e) => setNewLocationDescription(e.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        disabled
                        aria-label="Add location image coming soon"
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-500"
                      >
                        Add image (coming soon)
                      </button>
                    </div>
                  </div>
                )}
                {locationMode === 'existing' &&
                  locationSearch.trim() &&
                  !selectedExistingLocation &&
                  locationSuggestions.length === 0 && (
                  <p className="mt-2 text-xs text-slate-600">
                    No matching existing locations. Use “Create new location”.
                  </p>
                )}
                  </>
                )}
              </div>
            )}
          </section>
          <hr className="my-8 w-full border-0 border-t border-slate-300" aria-hidden="true" />
          <section>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-medium text-slate-900">Accommodation in this trip</h2>
              <span className="text-sm text-slate-600">{tripAccommodations.length} entries</span>
            </div>
            {tripAccommodations.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No accommodation added yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {tripAccommodations.map((entry) => (
                  <li key={entry.id} className="rounded-md border border-slate-300 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <FontAwesomeIcon icon={faHotel} aria-hidden="true" />
                          {entry.name}
                        </p>
                        <p className="text-sm text-slate-700">{entry.type}</p>
                        <p className="text-sm text-slate-600">{entry.address}</p>
                      </div>
                      {isOwner && showTripManagement && (
                        <button
                          type="button"
                          onClick={() => void handleRemoveAccommodation(entry.id)}
                          disabled={removingAccommodationId === entry.id}
                          aria-label={`Remove accommodation ${entry.name}`}
                          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                        >
                          {removingAccommodationId === entry.id ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {isOwner && showTripManagement && (
              <div className="mt-4 rounded-md border border-slate-300 bg-slate-100 p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-slate-800">Add accommodation</h3>
                    <p className="mt-1 text-xs text-slate-600">
                      Choose an existing accommodation or create a new one.
                    </p>
                  </div>
                  {tripAccommodations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAccommodationAddPanel((prev) => !prev)}
                      aria-expanded={showAccommodationAddPanel}
                      aria-label={
                        showAccommodationAddPanel
                          ? 'Collapse add or create accommodation'
                          : 'Expand add or create accommodation'
                      }
                      className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50"
                    >
                      <FontAwesomeIcon
                        icon={showAccommodationAddPanel ? faMinus : faPlus}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
                {(tripAccommodations.length === 0 || showAccommodationAddPanel) && (
                  <>
                <div className="my-4 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setAccommodationMode((prev) =>
                        prev === 'existing' ? 'new' : 'existing',
                      )
                    }
                    aria-label={
                      accommodationMode === 'existing'
                        ? 'Switch to create new accommodation'
                        : 'Switch to add existing accommodation'
                    }
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {accommodationMode === 'existing'
                      ? 'Switch to create new accommodation'
                      : 'Switch to add existing accommodation'}
                  </button>
                </div>

                {accommodationMode === 'existing' ? (
                  <div className="rounded-md border border-slate-300 bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Add existing accommodation
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <div className="relative">
                        <input
                          placeholder="Search accommodation"
                          aria-label="Search existing accommodations"
                          value={accommodationSearch}
                          onFocus={() => setShowAccommodationSuggestions(true)}
                          onBlur={() => {
                            setTimeout(() => setShowAccommodationSuggestions(false), 100)
                          }}
                          onChange={(e) => {
                            const nextSearch = e.target.value
                            setAccommodationSearch(nextSearch)
                            setShowAccommodationSuggestions(true)
                          }}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        {showAccommodationSuggestions &&
                          accommodationSuggestions.length > 0 && (
                            <ul className="absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-slate-300 bg-white shadow">
                              {accommodationSuggestions.map((item) => (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    aria-label={`Select accommodation ${item.name}`}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                                    onMouseDown={() => {
                                      setSelectedExistingAccommodation(item)
                                      setAccommodationSearch(
                                        `${item.name} (${item.type})`,
                                      )
                                      setShowAccommodationSuggestions(false)
                                    }}
                                  >
                                    {item.name} ({item.type}) - {item.address}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAddExistingAccommodation()}
                        disabled={savingAccommodation || !selectedExistingAccommodation}
                        aria-label={
                          savingAccommodation
                            ? 'Adding selected accommodation'
                            : 'Add selected accommodation'
                        }
                        className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        {savingAccommodation ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-slate-300 bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Create and add new accommodation
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <input
                        placeholder="Accommodation name"
                        aria-label="New accommodation name"
                        value={newAccommodationName}
                        onChange={(e) => setNewAccommodationName(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                      <input
                        placeholder="Type (hotel, hostel, ...)"
                        aria-label="New accommodation type"
                        value={newAccommodationType}
                        onChange={(e) => setNewAccommodationType(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                      <input
                        placeholder="Address"
                        aria-label="New accommodation address"
                        value={newAccommodationAddress}
                        onChange={(e) => setNewAccommodationAddress(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCreateAndAddAccommodation()}
                      disabled={
                        savingAccommodation ||
                        !newAccommodationName.trim() ||
                        !newAccommodationType.trim() ||
                        !newAccommodationAddress.trim()
                      }
                      aria-label={
                        savingAccommodation
                          ? 'Saving new accommodation'
                          : 'Create and add accommodation'
                      }
                      className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {savingAccommodation ? 'Saving…' : 'Create and add'}
                    </button>
                  </div>
                )}
                {accommodationMode === 'existing' &&
                  accommodationSearch.trim() &&
                  !selectedExistingAccommodation &&
                  accommodationSuggestions.length === 0 && (
                    <p className="mt-2 text-xs text-slate-600">
                      No matching existing accommodation. Use “Create new accommodation”.
                    </p>
                  )}
                  </>
                )}
              </div>
            )}
          </section>
          <hr className="my-8 w-full border-0 border-t border-slate-300" aria-hidden="true" />
          <section>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-medium text-slate-900">Transport in this trip</h2>
              <span className="text-sm text-slate-600">{tripTransports.length} entries</span>
            </div>
            {tripTransports.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No transport added yet.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {tripTransports.map((entry) => {
                  const removing = removingTransportId === entry.id
                  return (
                    <span
                      key={entry.id}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-800"
                    >
                      <FontAwesomeIcon
                        icon={faPersonWalkingLuggage}
                        aria-hidden="true"
                        className="text-slate-600"
                      />
                      <span className="truncate">{entry.type}</span>
                      {isOwner && showTripManagement && (
                        <button
                          type="button"
                          onClick={() => void handleRemoveTransport(entry.id)}
                          disabled={removing}
                          aria-label={removing ? `Removing transport ${entry.type}` : `Remove transport ${entry.type}`}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  )
                })}
              </div>
            )}

            {isOwner && showTripManagement && (
              <div className="mt-4 rounded-md border border-slate-300 bg-slate-100 p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-slate-800">Add transport</h3>
                    <p className="mt-1 text-xs text-slate-600">
                      Choose an existing transport type or create a new one.
                    </p>
                  </div>
                  {tripTransports.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowTransportAddPanel((prev) => !prev)}
                      aria-expanded={showTransportAddPanel}
                      aria-label={
                        showTransportAddPanel
                          ? 'Collapse add or create transport'
                          : 'Expand add or create transport'
                      }
                      className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50"
                    >
                      <FontAwesomeIcon
                        icon={showTransportAddPanel ? faMinus : faPlus}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
                {(tripTransports.length === 0 || showTransportAddPanel) && (
                  <>
                <div className="my-4 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setTransportMode((prev) =>
                        prev === 'existing' ? 'new' : 'existing',
                      )
                    }
                    aria-label={
                      transportMode === 'existing'
                        ? 'Switch to create new transport'
                        : 'Switch to add existing transport'
                    }
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {transportMode === 'existing'
                      ? 'Switch to create new transport'
                      : 'Switch to add existing transport'}
                  </button>
                </div>

                {transportMode === 'existing' ? (
                  <div className="rounded-md border border-slate-300 bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Add existing transport
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <div className="relative">
                        <input
                          placeholder="Search transport"
                          aria-label="Search existing transport types"
                          value={transportSearch}
                          onFocus={() => setShowTransportSuggestions(true)}
                          onBlur={() => {
                            setTimeout(() => setShowTransportSuggestions(false), 100)
                          }}
                          onChange={(e) => {
                            const nextSearch = e.target.value
                            setTransportSearch(nextSearch)
                            setShowTransportSuggestions(true)
                          }}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        {showTransportSuggestions && transportSuggestions.length > 0 && (
                          <ul className="absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-slate-300 bg-white shadow">
                            {transportSuggestions.map((item) => (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  aria-label={`Select transport ${item.type}`}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                                  onMouseDown={() => {
                                    setSelectedExistingTransport(item)
                                    setTransportSearch(item.type)
                                    setShowTransportSuggestions(false)
                                  }}
                                >
                                  {item.type}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAddExistingTransport()}
                        disabled={savingTransport || !selectedExistingTransport}
                        aria-label={savingTransport ? 'Adding selected transport' : 'Add selected transport'}
                        className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        {savingTransport ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-slate-300 bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Create and add new transport
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        placeholder="Transport type"
                        aria-label="New transport type"
                        value={newTransportType}
                        onChange={(e) => setNewTransportType(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void handleCreateAndAddTransport()}
                        disabled={savingTransport || !newTransportType.trim()}
                        aria-label={savingTransport ? 'Saving new transport' : 'Create and add transport'}
                        className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        {savingTransport ? 'Saving…' : 'Create and add'}
                      </button>
                    </div>
                  </div>
                )}
                {transportMode === 'existing' &&
                  transportSearch.trim() &&
                  !selectedExistingTransport &&
                  transportSuggestions.length === 0 && (
                  <p className="mt-2 text-xs text-slate-600">
                    No matching existing transport. Use “Create new transport”.
                  </p>
                )}
                  </>
                )}
              </div>
            )}
          </section>

          <section className="mt-8 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-medium text-slate-900">Community</h2>
              {user ? (
                <button
                  type="button"
                  onClick={() => void handleToggleLike()}
                  disabled={liking}
                  aria-label={
                    liking
                      ? 'Saving like status'
                      : likedByMe
                        ? 'Unlike this trip'
                        : 'Like this trip'
                  }
                  aria-pressed={likedByMe}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:text-red-600 disabled:opacity-50"
                >
                  <FontAwesomeIcon
                    icon={faHeart}
                    className={likedByMe ? 'text-red-600' : undefined}
                    aria-hidden="true"
                  />
                  {likeCount} likes
                </button>
              ) : (
                <p className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <FontAwesomeIcon icon={faHeart} aria-hidden="true" />
                  {likeCount} likes
                </p>
              )}
            </div>
            {!user && (
              <p className="mt-2 text-sm text-slate-600">Log in to like this trip.</p>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-800">Comments</h3>
              {user ? (
                <div className="mt-2 flex flex-col gap-2">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment"
                    aria-label="Write a comment"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCommentSubmit()}
                    disabled={commenting || !commentText.trim()}
                    aria-label={commenting ? 'Posting comment' : 'Post comment'}
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
                    <li key={comment.id} className="rounded-md border border-slate-300 p-2">
                      <p className="flex items-start gap-2 text-sm text-slate-800">
                        <FontAwesomeIcon
                          icon={faComment}
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-slate-500"
                        />
                        <span>{comment.content}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {Number.isFinite(comment.userId) ? (
                          <Link
                            to={`/users/${comment.userId}`}
                            aria-label={`Open profile of ${comment.userName || 'traveller'}`}
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
            <Link to="/" aria-label="Back to all trips" className="text-sm font-medium text-slate-700 hover:underline">
              ← Back to all trips
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
