import { useEffect, useState } from 'react'

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

} from '../api/accommodations'

import { loadMoreTripComments } from '../api/community'

import { createComment, deleteComment } from '../api/comments'

import { isTripLikedByCurrentUser, likeTrip, unlikeTrip } from '../api/likes'

import {

  addTripTransport,

  createTransport,

  deleteTripTransport,

} from '../api/transports'

import {

  addTripLocation,

  deleteTripLocation,

  deleteTripLocationImageById,

  uploadTripLocationImage,

} from '../api/tripLocations'

import { countTripLikes, deleteTrip } from '../api/trips'

import { useAuth } from '../context/AuthContext'

import { usePlaceSearch } from '../hooks/usePlaceSearch'
import { useAccommodationExternalInfo } from '../hooks/useAccommodationExternalInfo'
import { useStopExternalInfo } from '../hooks/useStopExternalInfo'
import { useTransportDistance } from '../hooks/useTransportDistance'
import { useTripCommunity } from '../hooks/useTripCommunity'
import { useTripDetailCore } from '../hooks/useTripDetailCore'
import { placeSearchErrorFromUnknown } from '../utils/placeSearchErrors'
import { transportWithPlaceCoords } from '../utils/transportGeo'
import { AccommodationActivityInfo } from '../components/ViatorTourEntry'
import { LocationTravelInfo } from '../components/LocationTravelInfo'
import { TransportDistanceInfo } from '../components/TransportDistanceInfo'
import { TripSectionHeader } from '../components/TripSectionHeader'
import { AddLocationModal } from '../components/trip/AddLocationModal'
import { AddAccommodationModal } from '../components/trip/AddAccommodationModal'
import { AddTransportModal } from '../components/trip/AddTransportModal'
import { EditAccommodationModal } from '../components/trip/EditAccommodationModal'
import { EditLocationVisitModal } from '../components/trip/EditLocationVisitModal'
import { EditTransportModal } from '../components/trip/EditTransportModal'
import { useTripModal } from '../context/TripModalContext'

import type {

  AccommodationResponse,

  CommentResponse,

  PlaceSuggestion,

  TransportResponse,

  TripLocationResponse,

} from '../types/api'

import { transportRouteLabel } from '../utils/transportRoute'



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



function formatMoney(cost?: number, currency?: string): string {
  if (cost == null || !currency) return ''
  return `${cost.toFixed(2)} ${currency}`
}

function TripDetailPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading trip">
      <div className="h-8 w-2/3 max-w-md rounded bg-slate-200" />
      <div className="h-4 w-1/2 max-w-sm rounded bg-slate-200" />
      <div className="h-20 rounded bg-slate-100" />
      <div className="h-4 w-full rounded bg-slate-100" />
      <div className="h-32 rounded bg-slate-100" />
      <div className="h-24 rounded bg-slate-100" />
    </div>
  )
}

function CommunitySectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading community">
      <div className="flex justify-between gap-4">
        <div className="h-10 flex-1 rounded bg-slate-100" />
        <div className="h-9 w-24 rounded bg-slate-200" />
      </div>
      <div className="h-16 rounded bg-slate-100" />
      <div className="h-12 rounded bg-slate-100" />
    </div>
  )
}

export function TripDetailPage() {

  const { id } = useParams()

  const navigate = useNavigate()

  const { user } = useAuth()
  const { openEditTrip, tripSaveRevision, lastTripBaseUpdate } = useTripModal()

  const tripId = id ? Number(id) : NaN

  const {
    trip,
    setTrip,
    tripLocations,
    setTripLocations,
    tripTransports,
    setTripTransports,
    tripAccommodations,
    setTripAccommodations,
    status: tripStatus,
    error: tripError,
    tripIdValid,
    tripLoading,
  } = useTripDetailCore(tripId, user != null)

  const {
    communityLoading,
    communityFailed,
    communityReady,
    error: communityError,
    likeCount,
    setLikeCount,
    likedByMe,
    setLikedByMe,
    comments,
    setComments,
    commentsNextCursor,
    setCommentsNextCursor,
    hasMoreComments,
    setHasMoreComments,
    totalCommentCount,
    setTotalCommentCount,
  } = useTripCommunity(tripId, tripIdValid)

  const { getEntry: getStopExternalEntry, fetchStopInfo } = useStopExternalInfo(tripLocations)
  const { getEntry: getAccommodationExternalEntry } =
    useAccommodationExternalInfo(tripAccommodations)
  const { getEntry: getTransportDistanceEntry } = useTransportDistance(tripTransports)

  const [isOwner, setIsOwner] = useState(false)

  const [showTripManagement, setShowTripManagement] = useState(false)

  const [showAddTransportModal, setShowAddTransportModal] = useState(false)

  const [showAddAccommodationModal, setShowAddAccommodationModal] = useState(false)

  const [showAddLocationModal, setShowAddLocationModal] = useState(false)

  const [deleting, setDeleting] = useState(false)

  const [liking, setLiking] = useState(false)

  const [loadingMoreComments, setLoadingMoreComments] = useState(false)

  const [commentText, setCommentText] = useState('')

  const [commenting, setCommenting] = useState(false)

  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  const [transportStartSearch, setTransportStartSearch] = useState('')

  const [transportEndSearch, setTransportEndSearch] = useState('')

  const [showTransportStartSuggestions, setShowTransportStartSuggestions] = useState(false)

  const [showTransportEndSuggestions, setShowTransportEndSuggestions] = useState(false)

  const [selectedTransportStart, setSelectedTransportStart] = useState<PlaceSuggestion | null>(null)

  const [selectedTransportEnd, setSelectedTransportEnd] = useState<PlaceSuggestion | null>(null)

  const [savingTransport, setSavingTransport] = useState(false)

  const [removingTransportId, setRemovingTransportId] = useState<number | null>(null)

  const [accomPlaceSearch, setAccomPlaceSearch] = useState('')

  const [showAccomPlaceSuggestions, setShowAccomPlaceSuggestions] = useState(false)

  const [selectedAccomPlace, setSelectedAccomPlace] = useState<PlaceSuggestion | null>(null)

  const [accomCheckInDate, setAccomCheckInDate] = useState('')

  const [accomCheckOutDate, setAccomCheckOutDate] = useState('')

  const [accomCost, setAccomCost] = useState('')

  const [accomCurrency, setAccomCurrency] = useState('EUR')

  const [savingAccommodation, setSavingAccommodation] = useState(false)

  const [removingAccommodationId, setRemovingAccommodationId] = useState<number | null>(

    null,

  )

  const [newLocationName, setNewLocationName] = useState('')

  const [selectedGeocode, setSelectedGeocode] = useState<PlaceSuggestion | null>(null)

  const [showGeocodeSuggestions, setShowGeocodeSuggestions] = useState(false)

  const [newLocationDescription, setNewLocationDescription] = useState('')

  const [newLocationStartDate, setNewLocationStartDate] = useState('')

  const [newLocationEndDate, setNewLocationEndDate] = useState('')

  const [savingLocation, setSavingLocation] = useState(false)

  const [removingLocationId, setRemovingLocationId] = useState<number | null>(null)

  const [removingImageId, setRemovingImageId] = useState<number | null>(null)

  const [uploadingLocationId, setUploadingLocationId] = useState<number | null>(null)

  const [editingTripLocationId, setEditingTripLocationId] = useState<number | null>(null)

  const [editingAccommodationId, setEditingAccommodationId] = useState<number | null>(null)

  const [editingTransportId, setEditingTransportId] = useState<number | null>(null)



  const locationPlaceSearch = usePlaceSearch(newLocationName, showGeocodeSuggestions)
  const accomPlaceSearchState = usePlaceSearch(accomPlaceSearch, showAccomPlaceSuggestions)
  const transportStartPlaceSearch = usePlaceSearch(
    transportStartSearch,
    showTransportStartSuggestions,
  )
  const transportEndPlaceSearch = usePlaceSearch(transportEndSearch, showTransportEndSuggestions)

  useEffect(() => {

    if (!showTripManagement) {
      setEditingTripLocationId(null)
      setEditingAccommodationId(null)
      setEditingTransportId(null)
    }

  }, [showTripManagement])



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

    setNewLocationStartDate((prev) => prev || trip.startDate)

    setNewLocationEndDate((prev) => prev || trip.startDate)

    setAccomCheckInDate((prev) => prev || trip.startDate)

    setAccomCheckOutDate((prev) => prev || trip.startDate)

  }, [trip?.startDate])



  useEffect(() => {

    if (!showTripManagement) {

      setShowAddTransportModal(false)

      setShowAddAccommodationModal(false)

      setShowAddLocationModal(false)

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

      alert('Choose a place from the suggestions.')

      return

    }

    setSavingLocation(true)

    try {

      const created = await addTripLocation({

        tripId: trip.id,

        googlePlaceId: selectedGeocode.placeId,

        description: newLocationDescription.trim(),

        startDate: `${newLocationStartDate}T00:00:00`,

        endDate: `${newLocationEndDate}T23:59:59`,

      })

      setTripLocations((prev) => [...prev, created])

      setNewLocationName('')

      setSelectedGeocode(null)

      setNewLocationDescription('')

      if (trip.startDate) {

        setNewLocationStartDate(trip.startDate)

        setNewLocationEndDate(trip.startDate)

      } else {

        setNewLocationStartDate('')

        setNewLocationEndDate('')

      }

      setShowAddLocationModal(false)

      void fetchStopInfo(
        created.id,
        created.googlePlaceId ?? selectedGeocode.placeId,
        {
          lat: created.latitude,
          lon: created.longitude,
          countryCode: created.countryCode,
          cityName: created.cityName,
        },
      )

    } catch (err) {
      alert(placeSearchErrorFromUnknown(err).message)
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



  function openAccommodationEdit(entry: AccommodationResponse) {

    setEditingAccommodationId(entry.id)

  }



  function closeAccommodationEdit() {

    setEditingAccommodationId(null)

  }



  function handleAccommodationSaved(updated: AccommodationResponse) {

    setTripAccommodations((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))

  }



  function openTransportEdit(entry: TransportResponse) {

    setEditingTransportId(entry.id)

  }



  function closeTransportEdit() {

    setEditingTransportId(null)

  }



  function handleTransportSaved(updated: TransportResponse) {

    setTripTransports((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))

  }



  async function handleCreateAndAddTransport() {

    if (!trip || !selectedTransportStart || !selectedTransportEnd) return

    setSavingTransport(true)

    try {

      const createdTransport = await createTransport({

        startGooglePlaceId: selectedTransportStart.placeId,

        endGooglePlaceId: selectedTransportEnd.placeId,

      })

      await addTripTransport({

        tripId: trip.id,

        transport: createdTransport,

        skipLinkCheck: true,

      })

      setTripTransports((prev) => [
        ...prev,
        transportWithPlaceCoords(createdTransport, selectedTransportStart, selectedTransportEnd),
      ])

      setTransportStartSearch('')

      setTransportEndSearch('')

      setSelectedTransportStart(null)

      setSelectedTransportEnd(null)

      setShowAddTransportModal(false)

    } catch (err) {

      alert(placeSearchErrorFromUnknown(err).message)

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



  async function handleCreateAndAddAccommodation() {

    if (!trip || !selectedAccomPlace || !accomCheckInDate || !accomCheckOutDate) {
      return
    }

    if (accomCheckOutDate < accomCheckInDate) {

      alert('Check-out must be on or after check-in.')

      return

    }

    const cost = Number.parseFloat(accomCost)

    if (!Number.isFinite(cost) || cost < 0) {

      alert('Enter a valid cost.')

      return

    }

    setSavingAccommodation(true)

    try {

      const createdAccommodation = await createAccommodation({
        googlePlaceId: selectedAccomPlace.placeId,

        checkInDate: accomCheckInDate,

        checkOutDate: accomCheckOutDate,

        cost,

        currency: accomCurrency,

      })

      await addTripAccommodation({

        tripId: trip.id,

        accommodation: createdAccommodation,

        skipLinkCheck: true,

      })

      setTripAccommodations((prev) => [...prev, createdAccommodation])

      setAccomPlaceSearch('')

      setSelectedAccomPlace(null)

      setAccomCheckInDate('')

      setAccomCheckOutDate('')

      setAccomCost('')

      setShowAddAccommodationModal(false)

    } catch (err) {

      alert(placeSearchErrorFromUnknown(err).message)

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

      {tripLoading && !trip && <TripDetailPageSkeleton />}

      {tripStatus === 'error' && !trip && tripError && (

        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">

          {tripError}

        </p>

      )}



      {trip && (

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

                          {entry.placeName ?? entry.locationName}

                        </div>

                        {entry.cityName ? (

                          <p className="text-xs text-slate-500">{entry.cityName}</p>

                        ) : null}

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
                      info={getStopExternalEntry(entry.id)?.info}
                      loading={getStopExternalEntry(entry.id)?.status === 'loading'}
                      error={getStopExternalEntry(entry.id)?.errorMessage}
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

                        {entry.checkInDate && entry.checkOutDate ? (

                          <p className="text-xs text-slate-500">

                            {formatDate(entry.checkInDate)} — {formatDate(entry.checkOutDate)}

                          </p>

                        ) : null}

                        {formatMoney(entry.cost, entry.currency) ? (

                          <p className="text-sm font-medium text-slate-800">

                            {formatMoney(entry.cost, entry.currency)}

                          </p>

                        ) : null}

                      </div>

                      {isOwner && showTripManagement && (

                        <div className="flex shrink-0 flex-wrap items-start gap-2">

                          <button

                            type="button"

                            onClick={() => openAccommodationEdit(entry)}

                            disabled={

                              editingAccommodationId === entry.id ||

                              removingAccommodationId === entry.id

                            }

                            aria-label={`Edit accommodation ${entry.name}`}

                            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"

                          >

                            <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />

                            Edit

                          </button>

                          <button

                            type="button"

                            onClick={() => void handleRemoveAccommodation(entry.id)}

                            disabled={

                              removingAccommodationId === entry.id ||

                              editingAccommodationId === entry.id

                            }

                            aria-label={`Remove accommodation ${entry.name}`}

                            className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"

                          >

                            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />

                            {removingAccommodationId === entry.id ? 'Removing…' : 'Remove'}

                          </button>

                        </div>

                      )}

                    </div>

                    <AccommodationActivityInfo
                      info={getAccommodationExternalEntry(entry.id)?.info}
                      loading={getAccommodationExternalEntry(entry.id)?.status === 'loading'}
                      error={getAccommodationExternalEntry(entry.id)?.errorMessage}
                    />

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

              <ul className="mt-3 space-y-3">

                {tripTransports.map((entry) => {

                  const removing = removingTransportId === entry.id

                  return (

                    <li

                      key={entry.id}

                      className="rounded-md border border-slate-300 bg-white p-3"

                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">

                      <FontAwesomeIcon

                        icon={faPersonWalkingLuggage}

                        aria-hidden="true"

                        className="text-slate-600"

                      />

                      <span>{transportRouteLabel(entry)}</span>

                      </p>

                        </div>

                      {isOwner && showTripManagement && (

                        <div className="flex shrink-0 flex-wrap items-start gap-2">

                          <button

                            type="button"

                            onClick={() => openTransportEdit(entry)}

                            disabled={removing || editingTransportId === entry.id}

                            aria-label={`Edit transport ${transportRouteLabel(entry)}`}

                            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"

                          >

                            <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />

                            Edit

                          </button>

                          <button

                            type="button"

                            onClick={() => void handleRemoveTransport(entry.id)}

                            disabled={removing || editingTransportId === entry.id}

                            aria-label={
                              removing
                                ? `Removing transport ${transportRouteLabel(entry)}`
                                : `Remove transport ${transportRouteLabel(entry)}`
                            }

                            className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"

                          >

                            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />

                            {removing ? 'Removing…' : 'Remove'}

                          </button>

                        </div>

                      )}

                      </div>

                      <TransportDistanceInfo
                        legs={getTransportDistanceEntry(entry.id)?.legs}
                        loading={getTransportDistanceEntry(entry.id)?.status === 'loading'}
                        error={getTransportDistanceEntry(entry.id)?.errorMessage}
                      />

                    </li>

                  )

                })}

              </ul>

            )}

          </section>

          <hr className="my-8 w-full border-0 border-t border-slate-300" aria-hidden="true" />

          <section className="mt-8">
            <h2 className="text-lg font-medium text-slate-900">Community</h2>

            {communityFailed && communityError && (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {communityError} Likes and comments may be unavailable.
              </p>
            )}

            <div className="mt-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
              {communityLoading && !communityReady ? (
                <CommunitySectionSkeleton />
              ) : (
              <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-slate-800">Comments</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {communityFailed
                      ? 'Comments unavailable'
                      : totalCommentCount === 1
                        ? '1 comment'
                        : `${totalCommentCount} comments`}
                  </p>
                </div>
                {user ? (
                  <button
                    type="button"
                    onClick={() => void handleToggleLike()}
                    disabled={liking || communityFailed}
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

              {user && !communityFailed ? (
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
              ) : user ? null : (
                <p className="mt-4 text-sm text-slate-600">Log in to comment.</p>
              )}
              {!communityFailed && comments.length > 0 ? (
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
              ) : !communityFailed ? (
                <p className="mt-4 text-sm text-slate-600">No comments yet.</p>
              ) : null}
              {!communityFailed && hasMoreComments ? (
                <button
                  type="button"
                  onClick={() => void handleLoadMoreComments()}
                  disabled={loadingMoreComments}
                  className="mt-3 text-sm font-medium text-slate-700 hover:underline disabled:opacity-50"
                >
                  {loadingMoreComments ? 'Loading…' : 'Load more comments'}
                </button>
              ) : null}
              </>
              )}
            </div>
          </section>

          <AddLocationModal
            open={showAddLocationModal}
            onClose={() => setShowAddLocationModal(false)}
            newLocationName={newLocationName}
            setNewLocationName={setNewLocationName}
            showGeocodeSuggestions={showGeocodeSuggestions}
            setShowGeocodeSuggestions={setShowGeocodeSuggestions}
            geocodeSuggestions={locationPlaceSearch.suggestions}
            geocodeSearchError={locationPlaceSearch.searchError}
            geocodeSearching={locationPlaceSearch.searching}
            selectedGeocode={selectedGeocode}
            setSelectedGeocode={setSelectedGeocode}
            newLocationDescription={newLocationDescription}
            setNewLocationDescription={setNewLocationDescription}
            newLocationStartDate={newLocationStartDate}
            setNewLocationStartDate={setNewLocationStartDate}
            newLocationEndDate={newLocationEndDate}
            setNewLocationEndDate={setNewLocationEndDate}
            savingLocation={savingLocation}
            onCreateAndAdd={() => void handleCreateAndAddLocation()}
          />

          <AddAccommodationModal
            open={showAddAccommodationModal}
            onClose={() => setShowAddAccommodationModal(false)}
            placeSearch={accomPlaceSearch}
            setPlaceSearch={setAccomPlaceSearch}
            showPlaceSuggestions={showAccomPlaceSuggestions}
            setShowPlaceSuggestions={setShowAccomPlaceSuggestions}
            placeSuggestions={accomPlaceSearchState.suggestions}
            placeSearchError={accomPlaceSearchState.searchError}
            placeSearching={accomPlaceSearchState.searching}
            selectedPlace={selectedAccomPlace}
            setSelectedPlace={setSelectedAccomPlace}
            checkInDate={accomCheckInDate}
            setCheckInDate={setAccomCheckInDate}
            checkOutDate={accomCheckOutDate}
            setCheckOutDate={setAccomCheckOutDate}
            cost={accomCost}
            setCost={setAccomCost}
            currency={accomCurrency}
            setCurrency={setAccomCurrency}
            savingAccommodation={savingAccommodation}
            onAdd={() => void handleCreateAndAddAccommodation()}
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

          <EditAccommodationModal
            entry={
              editingAccommodationId != null
                ? (tripAccommodations.find((a) => a.id === editingAccommodationId) ?? null)
                : null
            }
            onClose={closeAccommodationEdit}
            onSaved={handleAccommodationSaved}
          />

          <EditTransportModal
            entry={
              editingTransportId != null
                ? (tripTransports.find((t) => t.id === editingTransportId) ?? null)
                : null
            }
            onClose={closeTransportEdit}
            onSaved={handleTransportSaved}
          />

          <AddTransportModal
            open={showAddTransportModal}
            onClose={() => setShowAddTransportModal(false)}
            startPlaceSearch={transportStartSearch}
            setStartPlaceSearch={setTransportStartSearch}
            endPlaceSearch={transportEndSearch}
            setEndPlaceSearch={setTransportEndSearch}
            showStartSuggestions={showTransportStartSuggestions}
            setShowStartSuggestions={setShowTransportStartSuggestions}
            showEndSuggestions={showTransportEndSuggestions}
            setShowEndSuggestions={setShowTransportEndSuggestions}
            startSuggestions={transportStartPlaceSearch.suggestions}
            endSuggestions={transportEndPlaceSearch.suggestions}
            startSearchError={transportStartPlaceSearch.searchError}
            endSearchError={transportEndPlaceSearch.searchError}
            startSearching={transportStartPlaceSearch.searching}
            endSearching={transportEndPlaceSearch.searching}
            selectedStartPlace={selectedTransportStart}
            setSelectedStartPlace={setSelectedTransportStart}
            selectedEndPlace={selectedTransportEnd}
            setSelectedEndPlace={setSelectedTransportEnd}
            savingTransport={savingTransport}
            onAdd={() => void handleCreateAndAddTransport()}
          />

        </>

      )}

    </div>

  )

}
