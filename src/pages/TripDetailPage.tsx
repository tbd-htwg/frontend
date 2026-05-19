import { useEffect, useMemo, useState } from 'react'

import { Link, useNavigate, useParams } from 'react-router-dom'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {

  faGear,

  faHeart,

  faHotel,

  faImage,

  faPenToSquare,

  faPersonWalkingLuggage,

  faTrash,

  faUser,

} from '@fortawesome/free-solid-svg-icons'

import {

  addTripAccommodation,

  createAccommodation,

  deleteTripAccommodation,

  searchAccommodationsByNameContaining,

} from '../api/accommodations'

import { getTripCommunity, loadMoreTripComments } from '../api/community'

import { createComment, deleteComment } from '../api/comments'

import { searchLocationsByCityContaining } from '../api/locations'

import { isTripLikedByCurrentUser, likeTrip, unlikeTrip } from '../api/likes'

import {

  addTripTransport,

  createTransport,

  deleteTripTransport,

  searchTransportsByTypeContaining,

} from '../api/transports'

import {

  addTripLocation,

  deleteTripLocation,

  deleteTripLocationImageById,

  getTripLocationExternalInfo,

  uploadTripLocationImage,

} from '../api/tripLocations'

import { countTripLikes, deleteTrip, getTrip } from '../api/trips'

import { ApiError } from '../api/client'

import { useAuth } from '../context/AuthContext'

import { useDebouncedValue } from '../hooks/useDebouncedValue'

import { searchGeocodeSuggestions } from '../api/externalInfo'
import { LocationTravelInfo } from '../components/LocationTravelInfo'
import { TripSectionHeader } from '../components/TripSectionHeader'
import { AddLocationModal } from '../components/trip/AddLocationModal'
import { AddAccommodationModal } from '../components/trip/AddAccommodationModal'
import { AddTransportModal } from '../components/trip/AddTransportModal'
import { EditLocationVisitModal } from '../components/trip/EditLocationVisitModal'
import { useTripModal } from '../context/TripModalContext'

import type {

  AccommodationResponse,

  CommentResponse,

  GeocodingSuggestion,

  LocationResponse,

  TransportResponse,

  TripDetailsResponse,

  TripLocationResponse,

  TripExternalInfoResponse

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



function formatTripLocationDateTime(iso?: string): string {

  if (!iso) return '—'

  try {

    return new Date(iso).toLocaleString(undefined, {

      year: 'numeric',

      month: 'short',

      day: 'numeric',

      hour: '2-digit',

      minute: '2-digit',

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
  const { openEditTrip, tripSaveRevision, lastTripBaseUpdate } = useTripModal()

  const tripId = id ? Number(id) : NaN



  const [trip, setTrip] = useState<TripDetailsResponse | null>(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [isOwner, setIsOwner] = useState(false)

  const [showTripManagement, setShowTripManagement] = useState(false)

  const [showAddTransportModal, setShowAddTransportModal] = useState(false)

  const [showAddAccommodationModal, setShowAddAccommodationModal] = useState(false)

  const [showAddLocationModal, setShowAddLocationModal] = useState(false)

  const [deleting, setDeleting] = useState(false)

  const [likeCount, setLikeCount] = useState(0)

  const [likedByMe, setLikedByMe] = useState(false)

  const [liking, setLiking] = useState(false)

  const [comments, setComments] = useState<CommentResponse[]>([])

  const [commentsNextCursor, setCommentsNextCursor] = useState<string | null>(null)

  const [hasMoreComments, setHasMoreComments] = useState(false)

  const [loadingMoreComments, setLoadingMoreComments] = useState(false)

  const [totalCommentCount, setTotalCommentCount] = useState(0)

  const [commentText, setCommentText] = useState('')

  const [commenting, setCommenting] = useState(false)

  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  const [tripLocations, setTripLocations] = useState<TripLocationResponse[]>([])

  /** Locations created in this session (add-new flow); search fills suggestions via API. */


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

  const [selectedGeocode, setSelectedGeocode] = useState<GeocodingSuggestion | null>(null)

  const [geocodeSuggestions, setGeocodeSuggestions] = useState<GeocodingSuggestion[]>([])

  const [showGeocodeSuggestions, setShowGeocodeSuggestions] = useState(false)

  const [existingLocationDescription, setExistingLocationDescription] = useState('')

  const [newLocationDescription, setNewLocationDescription] = useState('')

  const [existingLocationStartDate, setExistingLocationStartDate] = useState('')

  const [existingLocationEndDate, setExistingLocationEndDate] = useState('')

  const [newLocationStartDate, setNewLocationStartDate] = useState('')

  const [newLocationEndDate, setNewLocationEndDate] = useState('')

  const [savingLocation, setSavingLocation] = useState(false)

  const [removingLocationId, setRemovingLocationId] = useState<number | null>(null)

  const [removingImageId, setRemovingImageId] = useState<number | null>(null)

  const [uploadingLocationId, setUploadingLocationId] = useState<number | null>(null)

  const [editingTripLocationId, setEditingTripLocationId] = useState<number | null>(null)



  const debouncedAccommodationSearch = useDebouncedValue(accommodationSearch, 300)

  const debouncedLocationSearch = useDebouncedValue(locationSearch, 300)

  const debouncedNewLocationName = useDebouncedValue(newLocationName, 1500)

  const debouncedTransportSearch = useDebouncedValue(transportSearch, 300)



  const [locationExternalInfo, setLocationExternalInfo] = useState<Record<number, TripExternalInfoResponse>>({})

  const [locationExternalInfoLoaded, setLocationExternalInfoLoaded] = useState(false)



  // Fetch suggestions when the user focuses the search field (even with an

  // empty query, which the paginated backend endpoint interprets as "give me

  // the newest page") and when the debounced query changes while the popover

  // is open. Gating on `showXxxSuggestions` keeps non-owners and collapsed

  // panels from triggering any network traffic at all.

  useEffect(() => {

    if (!showAccommodationSuggestions) return

    const q = debouncedAccommodationSearch.trim()

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

  }, [debouncedAccommodationSearch, showAccommodationSuggestions])



  useEffect(() => {

    if (!showLocationSuggestions) return

    const q = debouncedLocationSearch.trim()

    let cancelled = false

    searchLocationsByCityContaining(q)

      .then((hits) => {

        if (!cancelled) setLocationApiHits(hits)

      })

      .catch(() => {

        if (!cancelled) setLocationApiHits([])

      })

    return () => {

      cancelled = true

    }

  }, [debouncedLocationSearch, showLocationSuggestions])



  useEffect(() => {

    if (!showGeocodeSuggestions || locationMode !== 'new') {

      setGeocodeSuggestions([])

      return

    }

    const q = debouncedNewLocationName.trim()

    if (q.length < 2) {

      setGeocodeSuggestions([])

      return

    }

    let cancelled = false

    searchGeocodeSuggestions(q)

      .then((hits) => {

        if (!cancelled) setGeocodeSuggestions(hits)

      })

      .catch(() => {

        if (!cancelled) setGeocodeSuggestions([])

      })

    return () => {

      cancelled = true

    }

  }, [debouncedNewLocationName, showGeocodeSuggestions, locationMode])



  useEffect(() => {

    if (!showTransportSuggestions) return

    const q = debouncedTransportSearch.trim()

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

  }, [debouncedTransportSearch, showTransportSuggestions])



  const locationSuggestions = useMemo(() => {

    const q = locationSearch.trim().toLowerCase()

    if (!q) return locationApiHits

    return locationApiHits.filter((l) => l.city.toLowerCase().includes(q))

  }, [locationApiHits, locationSearch])



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

    const match = locationSuggestions.find((l) => l.city.toLowerCase() === q)

    setSelectedExistingLocation(match ?? null)

  }, [locationSearch, locationSuggestions])



  useEffect(() => {

    if (!showTripManagement) setEditingTripLocationId(null)

  }, [showTripManagement])



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

        const [t, community] = await Promise.all([getTrip(tripId), getTripCommunity(tripId)])

        if (cancelled) return

        setTrip(t)

        setComments(community.comments)

        setCommentsNextCursor(community.commentsNextCursor ?? null)

        setHasMoreComments(community.hasMoreComments)

        setTotalCommentCount(community.totalCommentCount)

        setTripLocations(t.tripLocations ?? [])

        setTripTransports(t.transports ?? [])

        setTripAccommodations(t.accommodations ?? [])

        setLikeCount(community.likeCount)

        setLikedByMe(community.likedByCurrentUser ?? false)

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

  }, [tripId])



  useEffect(() => {

    if (!trip) return

    const authorId = trip.authorId ?? trip.userId

    if (user) {

      setIsOwner(Number.isFinite(authorId) ? authorId === user.id : false)

    } else {

      setIsOwner(false)

    }

  }, [trip, user])



  useEffect(() => {

    if (!lastTripBaseUpdate || lastTripBaseUpdate.tripId !== tripId) return

    setTrip((prev) =>

      prev

        ? {

            ...prev,

            title: lastTripBaseUpdate.title,

            destination: lastTripBaseUpdate.destination,

            startDate: lastTripBaseUpdate.startDate,

            shortDescription: lastTripBaseUpdate.shortDescription,

            longDescription: lastTripBaseUpdate.longDescription,

          }

        : prev,

    )

  }, [tripSaveRevision, lastTripBaseUpdate, tripId])



  useEffect(() => {

    setShowTripManagement(false)

    setShowAddTransportModal(false)

    setShowAddAccommodationModal(false)

    setShowAddLocationModal(false)

  }, [tripId])



  useEffect(() => {

    if (!trip?.startDate) return

    setExistingLocationStartDate((prev) => prev || trip.startDate)

    setExistingLocationEndDate((prev) => prev || trip.startDate)

    setNewLocationStartDate((prev) => prev || trip.startDate)

    setNewLocationEndDate((prev) => prev || trip.startDate)

  }, [trip?.startDate])



  useEffect(() => {

    if (!showTripManagement) {

      setShowAddTransportModal(false)

      setShowAddAccommodationModal(false)

      setShowAddLocationModal(false)

    }

  }, [showTripManagement])






  useEffect(() => {

    if (!tripLocations.length) {

      setLocationExternalInfo({})

      setLocationExternalInfoLoaded(true)

      return

    }



    let cancelled = false

    setLocationExternalInfoLoaded(false)



    const fetchMissingLocationInfo = async () => {

      const stops = tripLocations.filter((loc) => Number.isFinite(loc.id) && loc.id > 0)

      await Promise.all(

        stops.map(async (location) => {

          if (cancelled) return

          try {

            const data = await getTripLocationExternalInfo(location.id)

            if (!cancelled) {

              setLocationExternalInfo((prev) =>

                prev[location.id] ? prev : { ...prev, [location.id]: data },

              )

            }

          } catch (err) {

            console.error(`Failed to fetch external info for location ${location.locationName}:`, err)

          }

        }),

      )

      if (!cancelled) {

        setLocationExternalInfoLoaded(true)

      }

    }



    void fetchMissingLocationInfo()



    return () => {

      cancelled = true

    }

  }, [tripLocations])



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

      const [likedByUser, likes] = await Promise.all([

        isTripLikedByCurrentUser(trip.id),

        countTripLikes(trip.id),

      ])

      setLikedByMe(likedByUser)

      setLikeCount(likes)

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Could not update like.')

    } finally {

      setLiking(false)

    }

  }



  async function handleLoadMoreComments() {

    if (!trip || !commentsNextCursor || loadingMoreComments) return

    setLoadingMoreComments(true)

    try {

      const page = await loadMoreTripComments(trip.id, commentsNextCursor, 10)

      setComments((prev) => [...prev, ...page.items])

      setCommentsNextCursor(page.nextCursor)

      setHasMoreComments(page.hasMore)

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Could not load more comments.')

    } finally {

      setLoadingMoreComments(false)

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

          userName: created.userName || user.name,

        },

        ...prev,

      ])

      setTotalCommentCount((c) => c + 1)

      setCommentText('')

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Could not add comment.')

    } finally {

      setCommenting(false)

    }

  }



  async function handleDeleteComment(comment: CommentResponse) {

    if (!user || !comment.id) return

    const mine = comment.userId === user.id

    const ownerDeleting = isOwner

    if (!mine && !ownerDeleting) return

    if (

      !window.confirm(

        mine

          ? 'Delete your comment?'

          : 'Remove this comment from your trip?',

      )

    ) {

      return

    }

    setDeletingCommentId(comment.id)

    try {

      await deleteComment(comment.id)

      setComments((prev) => prev.filter((c) => c.id !== comment.id))

      setTotalCommentCount((c) => Math.max(0, c - 1))

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Could not delete comment.')

    } finally {

      setDeletingCommentId(null)

    }

  }



  async function handleAddExistingLocation() {

    if (

      !trip ||

      !existingLocationDescription.trim() ||

      !existingLocationStartDate ||

      !existingLocationEndDate

    ) {

      return

    }

    if (existingLocationEndDate < existingLocationStartDate) {

      alert('End date must be on or after start date.')

      return

    }

    setSavingLocation(true)

    try {

      const selectedLocation = selectedExistingLocation

      if (!selectedLocation) {

        throw new Error('Choose an existing location first.')

      }

      const created = await addTripLocation({

        tripId: trip.id,

        city: selectedLocation.city,

        description: existingLocationDescription.trim(),

        startDate: `${existingLocationStartDate}T00:00:00`,

        endDate: `${existingLocationEndDate}T23:59:59`,

        formattedAddress: selectedLocation.formattedAddress,

        countryCode: selectedLocation.countryCode,

        latitude: selectedLocation.latitude,

        longitude: selectedLocation.longitude,

      })

      setTripLocations((prev) => [...prev, created])

      setExistingLocationDescription('')

      if (trip.startDate) {

        setExistingLocationStartDate(trip.startDate)

        setExistingLocationEndDate(trip.startDate)

      } else {

        setExistingLocationStartDate('')

        setExistingLocationEndDate('')

      }

      setLocationSearch('')

      setSelectedExistingLocation(null)

      setShowAddLocationModal(false)

      getTripLocationExternalInfo(created.id)

        .then((data) => {

          setLocationExternalInfo((prev) => ({ ...prev, [created.id]: data }))

        })

        .catch((err) => console.error('Failed to fetch external info for location:', err))

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Could not add existing location.')

    } finally {

      setSavingLocation(false)

    }

  }



  async function handleCreateAndAddLocation() {

    if (

      !trip ||

      !newLocationName.trim() ||

      !newLocationDescription.trim() ||

      !newLocationStartDate ||

      !newLocationEndDate

    ) {

      return

    }

    if (newLocationEndDate < newLocationStartDate) {

      alert('End date must be on or after start date.')

      return

    }

    if (!selectedGeocode) {

      alert('Choose a city from the suggestions so we can set coordinates.')

      return

    }

    setSavingLocation(true)

    try {

      const created = await addTripLocation({

        tripId: trip.id,

        city: selectedGeocode.city,

        description: newLocationDescription.trim(),

        startDate: `${newLocationStartDate}T00:00:00`,

        endDate: `${newLocationEndDate}T23:59:59`,

        formattedAddress: selectedGeocode.displayName,

        countryCode: selectedGeocode.countryCode,

        latitude: selectedGeocode.lat,

        longitude: selectedGeocode.lon,

      })

      setTripLocations((prev) => [...prev, created])

      setNewLocationName('')

      setSelectedGeocode(null)

      setGeocodeSuggestions([])

      setNewLocationDescription('')

      if (trip.startDate) {

        setNewLocationStartDate(trip.startDate)

        setNewLocationEndDate(trip.startDate)

      } else {

        setNewLocationStartDate('')

        setNewLocationEndDate('')

      }

      setLocationMode('existing')

      setShowAddLocationModal(false)

      getTripLocationExternalInfo(created.id)

        .then((data) => {

          setLocationExternalInfo((prev) => ({ ...prev, [created.id]: data }))

        })

        .catch((err) => console.error('Failed to fetch external info for location:', err))

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



  async function handleLocationImageSelected(entryId: number, file?: File) {

    if (!isOwner || !file) return

    setUploadingLocationId(entryId)

    try {

      const image = await uploadTripLocationImage(entryId, file)

      setTripLocations((prev) =>

        prev.map((entry) =>

          entry.id === entryId

            ? { ...entry, images: [...(entry.images ?? []), image] }

            : entry,

        ),

      )

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Could not upload location image.')

    } finally {

      setUploadingLocationId(null)

    }

  }



  async function handleRemoveLocationImage(entryId: number, imageId: number) {

    if (!isOwner) return

    if (!window.confirm('Remove this image from the location?')) return

    setRemovingImageId(imageId)

    try {

      await deleteTripLocationImageById(entryId, imageId)

      setTripLocations((prev) =>

        prev.map((entry) =>

          entry.id === entryId

            ? { ...entry, images: (entry.images ?? []).filter((img) => img.id !== imageId) }

            : entry,

        ),

      )

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Could not remove image.')

    } finally {

      setRemovingImageId(null)

    }

  }



  function openTripLocationEdit(entry: TripLocationResponse) {

    setEditingTripLocationId(entry.id)

  }



  function closeTripLocationEdit() {

    setEditingTripLocationId(null)

  }



  function handleLocationVisitSaved(updated: TripLocationResponse) {

    setTripLocations((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))

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

      setShowAddTransportModal(false)

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

      setShowAddTransportModal(false)

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

      setShowAddAccommodationModal(false)

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

      setShowAddAccommodationModal(false)

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

              {Number.isFinite(trip.authorId ?? trip.userId ?? NaN) && (

                <p className="mt-1 text-sm text-slate-600">

                  by{' '}

                  <Link

                    to={`/users/${trip.authorId ?? trip.userId}`}

                    aria-label={`Open profile of ${trip.authorName || 'traveller'}`}

                    className="font-medium hover:underline"

                  >

                    @{trip.authorName || 'traveller'}

                  </Link>

                </p>

              )}

            </div>

            {isOwner && showTripManagement && (

              <div className="flex flex-wrap gap-2">

                <button

                  type="button"

                  onClick={() => openEditTrip(trip.id)}

                  aria-label="Edit this trip"

                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"

                >

                  <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />

                  Edit

                </button>

                <button

                  type="button"

                  onClick={() => void handleDelete()}

                  disabled={deleting}

                  aria-label={deleting ? 'Deleting this trip' : 'Delete this trip'}

                  className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"

                >

                  <FontAwesomeIcon icon={faTrash} aria-hidden="true" />

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

          <p className="mt-1 break-words text-slate-800">{trip.shortDescription}</p>



          <p className="mt-6 text-sm font-medium text-slate-700">Details</p>

          <p className="mt-1 break-words whitespace-pre-wrap text-slate-800">{trip.longDescription}</p>

          <hr className="my-8 w-full border-0 border-t border-slate-300" aria-hidden="true" />

          <section>



            <TripSectionHeader
              title="Locations in this trip"
              count={tripLocations.length}
              onAdd={isOwner && showTripManagement ? () => setShowAddLocationModal(true) : undefined}
              addAriaLabel="Add location to trip"
            />

            {tripLocations.length === 0 ? (

              <p className="mt-3 text-sm text-slate-600">No locations added yet.</p>

            ) : (

              <ul className="mt-3 space-y-3">

                {tripLocations.map((entry) => (

                  <li key={entry.id} className="rounded-md border border-slate-300 bg-white p-3">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">

                          <FontAwesomeIcon icon={faImage} aria-label="Location image placeholder" />

                          {entry.locationName}

                        </div>

                        {entry.formattedAddress || entry.address ? (

                          <p className="mt-1 text-xs text-slate-600">

                            {entry.formattedAddress ?? entry.address}

                          </p>

                        ) : null}

                            <dl className="mt-2 grid max-w-md gap-1 text-xs text-slate-600 sm:grid-cols-2">

                              <div>

                                <dt className="font-medium text-slate-500">Start</dt>

                                <dd className="text-slate-800">

                                  {formatTripLocationDateTime(entry.startDate)}

                                </dd>

                              </div>

                              <div>

                                <dt className="font-medium text-slate-500">End</dt>

                                <dd className="text-slate-800">

                                  {formatTripLocationDateTime(entry.endDate)}

                                </dd>

                              </div>

                            </dl>

                            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">

                              {entry.description?.trim()

                                ? entry.description

                                : 'No description for this visit yet.'}

                            </p>

                        {!user ? (

                          <p className="mt-2 text-xs text-slate-500">

                            Log in to view images for this location.

                          </p>

                        ) : (entry.images?.length ?? 0) > 0 || (isOwner && showTripManagement) ? (

                          <div className="mt-2 flex max-w-full gap-2 overflow-x-auto pb-1">

                            {(entry.images ?? []).map((image, index) => (

                              <div key={`${entry.id}-${image.id}-${index}`} className="relative shrink-0">

                                <img

                                  src={image.signedReadUrl}

                                  alt={`Location ${entry.locationName} image ${index + 1}`}

                                  className="h-40 w-56 rounded-md border border-slate-200 object-cover"

                                  loading="lazy"

                                />

                                {isOwner && showTripManagement && image.id > 0 && (

                                  <button

                                    type="button"

                                    onClick={() => void handleRemoveLocationImage(entry.id, image.id)}

                                    disabled={

                                      removingImageId === image.id ||

                                      uploadingLocationId === entry.id ||

                                      editingTripLocationId === entry.id

                                    }

                                    aria-label={`Remove image ${index + 1} for ${entry.locationName}`}

                                    className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white hover:bg-black/80 disabled:opacity-50"

                                  >

                                    {removingImageId === image.id ? '…' : '×'}

                                  </button>

                                )}

                              </div>

                            ))}

                            {isOwner && showTripManagement && (

                              <label className="inline-flex h-40 w-56 shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100">

                                {uploadingLocationId === entry.id

                                  ? 'Uploading image...'

                                  : 'Add image'}

                                <input

                                  type="file"

                                  accept="image/*"

                                  className="hidden"

                                  disabled={

                                    uploadingLocationId === entry.id ||

                                    removingImageId !== null ||

                                    editingTripLocationId === entry.id

                                  }

                                  onChange={(e) => {

                                    const file = e.target.files?.[0]

                                    void handleLocationImageSelected(entry.id, file)

                                    e.currentTarget.value = ''

                                  }}

                                />

                              </label>

                            )}

                          </div>

                        ) : (

                          <p className="mt-2 text-xs text-slate-500">No image uploaded yet.</p>

                        )}

                      </div>

                      {isOwner && showTripManagement && (

                        <div className="flex shrink-0 flex-wrap items-start gap-2">

                          <button

                            type="button"

                            onClick={() => openTripLocationEdit(entry)}

                            disabled={

                              editingTripLocationId === entry.id ||

                              uploadingLocationId === entry.id ||

                              removingImageId !== null ||

                              removingLocationId === entry.id

                            }

                            aria-label={`Edit visit details for ${entry.locationName}`}

                            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"

                          >

                            <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />

                            Edit

                          </button>

                          <button

                            type="button"

                            onClick={() => void handleRemoveLocation(entry.id)}

                            disabled={

                              removingLocationId === entry.id ||

                              editingTripLocationId === entry.id

                            }

                            aria-label={`Remove location ${entry.locationName}`}

                            className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"

                          >

                            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />

                            {removingLocationId === entry.id ? 'Removing…' : 'Remove'}

                          </button>

                        </div>

                      )}



                    </div>

                    <LocationTravelInfo

                      info={locationExternalInfo[entry.id]}

                      loading={!locationExternalInfoLoaded && !locationExternalInfo[entry.id]}

                    />

                  </li>

                ))}

              </ul>

            )}










          </section>

          <hr className="my-8 w-full border-0 border-t border-slate-300" aria-hidden="true" />

          <section>



            <TripSectionHeader
              title="Accommodation in this trip"
              count={tripAccommodations.length}
              onAdd={isOwner && showTripManagement ? () => setShowAddAccommodationModal(true) : undefined}
              addAriaLabel="Add accommodation to trip"
            />

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

                          className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"

                        >

                          <FontAwesomeIcon icon={faTrash} aria-hidden="true" />

                          {removingAccommodationId === entry.id ? 'Removing…' : 'Remove'}

                        </button>

                      )}

                    </div>

                  </li>

                ))}

              </ul>

            )}

          </section>

          <hr className="my-8 w-full border-0 border-t border-slate-300" aria-hidden="true" />

          <section>



            <TripSectionHeader
              title="Transport in this trip"
              count={tripTransports.length}
              onAdd={isOwner && showTripManagement ? () => setShowAddTransportModal(true) : undefined}
              addAriaLabel="Add transport to trip"
            />

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

          </section>

          <hr className="my-8 w-full border-0 border-t border-slate-300" aria-hidden="true" />

          <section className="mt-8">
            <h2 className="text-lg font-medium text-slate-900">Community</h2>

            <div className="mt-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-slate-800">Comments</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {totalCommentCount === 1 ? '1 comment' : `${totalCommentCount} comments`}
                  </p>
                </div>
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
                    className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 disabled:opacity-50"
                  >
                    <FontAwesomeIcon
                      icon={faHeart}
                      className={likedByMe ? 'text-red-600' : ''}
                      aria-hidden="true"
                    />
                    {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                  </button>
                ) : (
                  <p className="inline-flex shrink-0 items-center gap-2 text-sm text-slate-700">
                    <FontAwesomeIcon icon={faHeart} aria-hidden="true" />
                    {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                  </p>
                )}
              </div>

              {user ? (
                <form
                  className="mt-4 flex flex-col gap-2 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void handleCommentSubmit()
                  }}
                >
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment…"
                    aria-label="Comment text"
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={commenting || !commentText.trim()}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {commenting ? 'Posting…' : 'Post'}
                  </button>
                </form>
              ) : (
                <p className="mt-4 text-sm text-slate-600">Log in to comment.</p>
              )}
              {comments.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {comments.map((comment) => (
                    <li key={comment.id} className="rounded-md border border-slate-200 p-2">
                      <p className="break-words text-sm text-slate-800">{comment.content}</p>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">
                          {comment.userName ? `@${comment.userName}` : `Traveller #${comment.userId}`} ·{' '}
                          {formatTripLocationDateTime(comment.createdAt)}
                        </p>
                        {user &&
                        (comment.userId === user.id || isOwner) &&
                        (comment.userId === user.id || showTripManagement) ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteComment(comment)}
                            disabled={deletingCommentId === comment.id}
                            className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
                          >
                            {deletingCommentId === comment.id ? 'Deleting…' : 'Delete'}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-600">No comments yet.</p>
              )}
              {hasMoreComments ? (
                <button
                  type="button"
                  onClick={() => void handleLoadMoreComments()}
                  disabled={loadingMoreComments}
                  className="mt-3 text-sm font-medium text-slate-700 hover:underline disabled:opacity-50"
                >
                  {loadingMoreComments ? 'Loading…' : 'Load more comments'}
                </button>
              ) : null}
            </div>
          </section>

          <AddLocationModal
            open={showAddLocationModal}
            onClose={() => setShowAddLocationModal(false)}
            locationMode={locationMode}
            setLocationMode={setLocationMode}
            locationSearch={locationSearch}
            setLocationSearch={setLocationSearch}
            showLocationSuggestions={showLocationSuggestions}
            setShowLocationSuggestions={setShowLocationSuggestions}
            locationSuggestions={locationSuggestions}
            selectedExistingLocation={selectedExistingLocation}
            setSelectedExistingLocation={setSelectedExistingLocation}
            existingLocationDescription={existingLocationDescription}
            setExistingLocationDescription={setExistingLocationDescription}
            existingLocationStartDate={existingLocationStartDate}
            setExistingLocationStartDate={setExistingLocationStartDate}
            existingLocationEndDate={existingLocationEndDate}
            setExistingLocationEndDate={setExistingLocationEndDate}
            savingLocation={savingLocation}
            onAddExisting={() => void handleAddExistingLocation()}
            newLocationName={newLocationName}
            setNewLocationName={setNewLocationName}
            showGeocodeSuggestions={showGeocodeSuggestions}
            setShowGeocodeSuggestions={setShowGeocodeSuggestions}
            geocodeSuggestions={geocodeSuggestions}
            selectedGeocode={selectedGeocode}
            setSelectedGeocode={setSelectedGeocode}
            newLocationDescription={newLocationDescription}
            setNewLocationDescription={setNewLocationDescription}
            newLocationStartDate={newLocationStartDate}
            setNewLocationStartDate={setNewLocationStartDate}
            newLocationEndDate={newLocationEndDate}
            setNewLocationEndDate={setNewLocationEndDate}
            onCreateAndAdd={() => void handleCreateAndAddLocation()}
          />

          <AddAccommodationModal
            open={showAddAccommodationModal}
            onClose={() => setShowAddAccommodationModal(false)}
            accommodationMode={accommodationMode}
            setAccommodationMode={setAccommodationMode}
            accommodationSearch={accommodationSearch}
            setAccommodationSearch={setAccommodationSearch}
            showAccommodationSuggestions={showAccommodationSuggestions}
            setShowAccommodationSuggestions={setShowAccommodationSuggestions}
            accommodationSuggestions={accommodationSuggestions}
            selectedExistingAccommodation={selectedExistingAccommodation}
            setSelectedExistingAccommodation={setSelectedExistingAccommodation}
            savingAccommodation={savingAccommodation}
            onAddExisting={() => void handleAddExistingAccommodation()}
            newAccommodationName={newAccommodationName}
            setNewAccommodationName={setNewAccommodationName}
            newAccommodationType={newAccommodationType}
            setNewAccommodationType={setNewAccommodationType}
            newAccommodationAddress={newAccommodationAddress}
            setNewAccommodationAddress={setNewAccommodationAddress}
            onCreateAndAdd={() => void handleCreateAndAddAccommodation()}
          />

          <EditLocationVisitModal
            entry={
              editingTripLocationId != null
                ? (tripLocations.find((loc) => loc.id === editingTripLocationId) ?? null)
                : null
            }
            onClose={closeTripLocationEdit}
            onSaved={handleLocationVisitSaved}
          />

          <AddTransportModal
            open={showAddTransportModal}
            onClose={() => setShowAddTransportModal(false)}
            transportMode={transportMode}
            setTransportMode={setTransportMode}
            transportSearch={transportSearch}
            setTransportSearch={setTransportSearch}
            showTransportSuggestions={showTransportSuggestions}
            setShowTransportSuggestions={setShowTransportSuggestions}
            transportSuggestions={transportSuggestions}
            selectedExistingTransport={selectedExistingTransport}
            setSelectedExistingTransport={setSelectedExistingTransport}
            savingTransport={savingTransport}
            onAddExisting={() => void handleAddExistingTransport()}
            newTransportType={newTransportType}
            setNewTransportType={setNewTransportType}
            onCreateAndAdd={() => void handleCreateAndAddTransport()}
          />

        </>

      )}

    </div>

  )

}
