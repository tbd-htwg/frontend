import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { ProfileHero } from '../components/profile/ProfileHero'
import { ApiError } from '../api/client'
import { PaginationControls } from '../components/PaginationControls'
import { TripFeedCard } from '../components/TripFeedCard'
import { findTripsByUserId } from '../api/trips'
import { getUserById } from '../api/users'
import { useAuth } from '../context/AuthContext'
import { useProfileModal } from '../context/ProfileModalContext'
import type { PaginatedResponse, TripListItemResponse, UserDetailsResponse } from '../types/api'
import { loadFeedImagesPhased } from '../utils/feedImages'
import { tripFeedPropsFromBrowse } from '../utils/tripFeed'

const PAGE_SIZE = 10

const editProfileButtonClass =
  'inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50'

export function UserProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { openEditProfile, profileSaveRevision, lastProfileUpdate } = useProfileModal()
  const userId = id ? Number(id) : NaN
  const [profile, setProfile] = useState<UserDetailsResponse | null>(null)
  const [tripPage, setTripPage] = useState<PaginatedResponse<TripListItemResponse> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [feedImagesByTripId, setFeedImagesByTripId] = useState<Record<number, string[]>>({})
  const [feedImagesSettledTripIds, setFeedImagesSettledTripIds] = useState<Set<number>>(
    () => new Set(),
  )

  useEffect(() => {
    if (!Number.isFinite(userId)) {
      setError('Invalid user id.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      getUserById(userId, user != null),
      findTripsByUserId(userId, currentPage, PAGE_SIZE),
    ])
      .then(([data, page]) => {
        if (!cancelled) {
          setProfile(data)
          setTripPage(page)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Could not load user profile.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [currentPage, userId, user])

  useEffect(() => {
    setCurrentPage(1)
  }, [profile?.id])

  useEffect(() => {
    if (!lastProfileUpdate || !profile || lastProfileUpdate.id !== profile.id) return
    setProfile((prev) => (prev ? { ...prev, ...lastProfileUpdate } : lastProfileUpdate))
  }, [profileSaveRevision, lastProfileUpdate, profile?.id])

  useEffect(() => {
    if (!user) {
      setFeedImagesByTripId({})
      setFeedImagesSettledTripIds(new Set())
      return
    }
    const items = tripPage?.items ?? []
    if (items.length === 0) {
      setFeedImagesByTripId({})
      setFeedImagesSettledTripIds(new Set())
      return
    }
    const ids = items.map((t) => t.id)
    setFeedImagesByTripId({})
    setFeedImagesSettledTripIds(new Set())
    return loadFeedImagesPhased(ids, {
      onFirstPhase: (map, settled) => {
        setFeedImagesByTripId(map)
        setFeedImagesSettledTripIds(new Set(settled))
      },
      onFullPhase: (map) => {
        setFeedImagesByTripId(map)
      },
    })
  }, [user, tripPage])

  if (!Number.isFinite(userId)) return <p className="text-red-800">Invalid user.</p>

  const totalTrips = tripPage?.totalItems ?? 0
  const totalPages = tripPage?.totalPages ?? 1
  const visibleTrips = tripPage?.items ?? []
  const viewingOwnProfile = user?.id === profile?.id

  return (
    <div>
      {loading && <p className="text-slate-500">Loading…</p>}
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {!loading && !error && profile && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold text-slate-900">{profile.name}</h1>
            {viewingOwnProfile ? (
              <button
                type="button"
                onClick={() => openEditProfile()}
                aria-label="Edit your profile"
                className={editProfileButtonClass}
              >
                <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                Edit profile
              </button>
            ) : null}
          </div>

          <ProfileHero
            email={viewingOwnProfile ? profile.email || user?.email : undefined}
            description={profile.description}
            imageUrl={user ? profile.imageUrl : null}
            imageAlt={`${profile.name}'s profile`}
            showPlaceholderWhenNoImage
            loggedOutImagePlaceholder={
              user ? 'No profile image' : 'Log in to view profile pictures'
            }
          />

          <hr
            className="my-8 w-full border-0 border-t border-slate-300"
            aria-hidden="true"
          />

          <section>
            <h2 className="text-lg font-medium text-slate-900">Trips by {profile.name}</h2>
            {totalTrips === 0 ? (
              <p className="mt-3 text-slate-600">No trips yet.</p>
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
                <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {visibleTrips.map((t) => (
                    <TripFeedCard
                      key={t.id}
                      {...tripFeedPropsFromBrowse(
                        t,
                        user != null,
                        feedImagesByTripId,
                        user?.id,
                        {
                          isOwned: viewingOwnProfile,
                          omitAuthorLabel: true,
                          feedImagesSettledTripIds,
                        },
                      )}
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
