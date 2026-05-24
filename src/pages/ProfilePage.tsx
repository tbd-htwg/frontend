import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faPlus } from '@fortawesome/free-solid-svg-icons'
import { ProfileHero } from '../components/profile/ProfileHero'
import { useProfileModal } from '../context/ProfileModalContext'
import { useTripModal } from '../context/TripModalContext'
import { fetchFeedLocationImageUrls, findTripsByUserId } from '../api/trips'
import { deleteUserProfileImage, getUserById, uploadUserProfileImage } from '../api/users'
import { ApiError } from '../api/client'
import { PaginationControls } from '../components/PaginationControls'
import { TripFeedCard } from '../components/TripFeedCard'
import { useAuth } from '../context/AuthContext'
import type { PaginatedResponse, TripListItemResponse, UserDetailsResponse } from '../types/api'
import { tripFeedPropsFromBrowse } from '../utils/tripFeed'

const PAGE_SIZE = 10

const editProfileButtonClass =
  'inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50'

export function ProfilePage() {
  const { user, updateSessionUser } = useAuth()
  const { openCreateTrip } = useTripModal()
  const { openEditProfile, profileSaveRevision, lastProfileUpdate } = useProfileModal()
  const [details, setDetails] = useState<UserDetailsResponse | null>(null)
  const [tripPage, setTripPage] = useState<PaginatedResponse<TripListItemResponse> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [removingProfileImage, setRemovingProfileImage] = useState(false)
  const [feedImagesByTripId, setFeedImagesByTripId] = useState<Record<number, string[]>>({})

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      getUserById(user.id, true),
      findTripsByUserId(user.id, currentPage, PAGE_SIZE),
    ])
      .then(([d, page]) => {
        if (!cancelled) {
          setDetails(d)
          setTripPage(page)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load your profile.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [currentPage, user])

  useEffect(() => {
    setCurrentPage(1)
  }, [details?.id])

  useEffect(() => {
    if (!lastProfileUpdate || !user || lastProfileUpdate.id !== user.id) return
    setDetails((prev) => (prev ? { ...prev, ...lastProfileUpdate } : lastProfileUpdate))
  }, [profileSaveRevision, lastProfileUpdate, user])

  useEffect(() => {
    const items = tripPage?.items ?? []
    if (items.length === 0) {
      setFeedImagesByTripId({})
      return
    }
    const ids = items.map((t) => t.id)
    let cancelled = false
    fetchFeedLocationImageUrls(ids).then((map) => {
      if (!cancelled) setFeedImagesByTripId(map)
    })
    return () => {
      cancelled = true
    }
  }, [tripPage])

  async function handleProfileImageSelected(file: File) {
    if (!user) return
    setUploadingImage(true)
    try {
      const signedReadUrl = await uploadUserProfileImage(user.id, file)
      const [updatedUser, freshTripPage] = await Promise.all([
        getUserById(user.id, true),
        findTripsByUserId(user.id, currentPage, PAGE_SIZE),
      ])
      const withImage = { ...updatedUser, imageUrl: signedReadUrl || updatedUser.imageUrl }
      updateSessionUser(withImage)
      setDetails(withImage)
      setTripPage(freshTripPage)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload profile image.'
      alert(message)
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleRemoveProfileImage() {
    if (!user || !details?.imageUrl) return
    if (!window.confirm('Remove your profile picture?')) return
    setRemovingProfileImage(true)
    try {
      await deleteUserProfileImage(user.id)
      const [updatedUser, freshTripPage] = await Promise.all([
        getUserById(user.id, true),
        findTripsByUserId(user.id, currentPage, PAGE_SIZE),
      ])
      updateSessionUser(updatedUser)
      setDetails(updatedUser)
      setTripPage(freshTripPage)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove profile image.'
      alert(message)
    } finally {
      setRemovingProfileImage(false)
    }
  }

  if (!user) return null

  const totalTrips = tripPage?.totalItems ?? 0
  const totalPages = tripPage?.totalPages ?? 1
  const visibleTrips = tripPage?.items ?? []

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">{details?.name ?? user.name}</h1>
        {!loading && !error && details ? (
          <button
            type="button"
            onClick={() => openEditProfile()}
            aria-label="Edit profile"
            className={editProfileButtonClass}
          >
            <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
            Edit profile
          </button>
        ) : null}
      </div>

      {loading && <p className="mt-6 text-slate-500">Loading…</p>}
      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && details && (
        <>
          <ProfileHero
            email={details.email || user.email}
            description={details.description}
            imageUrl={details.imageUrl}
            imageAlt={`${details.name}'s profile`}
            avatarEditable
            showPlaceholderWhenNoImage
            loggedOutImagePlaceholder="No profile image"
            uploadingImage={uploadingImage}
            removingProfileImage={removingProfileImage}
            onImageSelected={(file) => void handleProfileImageSelected(file)}
            onRemoveImage={() => void handleRemoveProfileImage()}
          />

          <hr
            className="my-8 w-full border-0 border-t border-slate-300"
            aria-hidden="true"
          />

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-slate-900">Your trips</h2>
              <button
                type="button"
                onClick={() => openCreateTrip()}
                aria-label="Create new trip"
                className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                New trip
              </button>
            </div>
            {totalTrips === 0 ? (
              <p className="mt-4 text-slate-600">You have no trips yet.</p>
            ) : (
              <>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={PAGE_SIZE}
                  totalItems={totalTrips}
                  itemLabel="trips"
                  onPageChange={setCurrentPage}
                />
                <ul className="mt-6 space-y-4">
                  {visibleTrips.map((t) => (
                    <TripFeedCard
                      key={t.id}
                      {...tripFeedPropsFromBrowse(t, true, feedImagesByTripId, user.id, {
                        isOwned: true,
                        omitAuthorLabel: true,
                      })}
                    />
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}
