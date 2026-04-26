import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faPlus, faUser } from '@fortawesome/free-solid-svg-icons'
import { findTripsByUserId } from '../api/trips'
import { deleteUserProfileImage, getUserById, patchUser, uploadUserProfileImage } from '../api/users'
import { ApiError } from '../api/client'
import { PaginationControls } from '../components/PaginationControls'
import { useAuth } from '../context/AuthContext'
import type { PaginatedResponse, TripListItemResponse, UserDetailsResponse } from '../types/api'

const PAGE_SIZE = 10

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export function ProfilePage() {
  const { user, updateSessionUser } = useAuth()
  const [details, setDetails] = useState<UserDetailsResponse | null>(null)
  const [tripPage, setTripPage] = useState<PaginatedResponse<TripListItemResponse> | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [removingProfileImage, setRemovingProfileImage] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      getUserById(user.id),
      findTripsByUserId(user.id, currentPage, PAGE_SIZE),
    ])
      .then(([d, page]) => {
        if (!cancelled) {
          setDetails(d)
          setTripPage(page)
          setEmail(d.email)
          setName(d.name)
          setDescription(d.description)
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

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaveError(null)
    setSaving(true)
    try {
      const updated = await patchUser(user.id, {
        email: email.trim(),
        name: name.trim(),
        description: description.trim(),
      })
      updateSessionUser(updated)
      const [fresh, freshTripPage] = await Promise.all([
        getUserById(user.id),
        findTripsByUserId(user.id, currentPage, PAGE_SIZE),
      ])
      setDetails(fresh)
      setTripPage(freshTripPage)
      setEmail(fresh.email)
      setName(fresh.name)
      setDescription(fresh.description)
      setShowEditForm(false)
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Could not update profile.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleProfileImageSelected(file?: File) {
    if (!user || !file) return
    setSaveError(null)
    setUploadingImage(true)
    try {
      await uploadUserProfileImage(user.id, file)
      const [updatedUser, freshTripPage] = await Promise.all([
        getUserById(user.id),
        findTripsByUserId(user.id, currentPage, PAGE_SIZE),
      ])
      updateSessionUser(updatedUser)
      setDetails(updatedUser)
      setTripPage(freshTripPage)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload profile image.'
      setSaveError(message)
      alert(message)
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleRemoveProfileImage() {
    if (!user || !details?.imageUrl) return
    if (!window.confirm('Remove your profile picture?')) return
    setSaveError(null)
    setRemovingProfileImage(true)
    try {
      await deleteUserProfileImage(user.id)
      const [updatedUser, freshTripPage] = await Promise.all([
        getUserById(user.id),
        findTripsByUserId(user.id, currentPage, PAGE_SIZE),
      ])
      updateSessionUser(updatedUser)
      setDetails(updatedUser)
      setTripPage(freshTripPage)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove profile image.'
      setSaveError(message)
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
      <h1 className="text-2xl font-semibold text-slate-900">{details?.name ?? user.name}</h1>

      {loading && <p className="mt-6 text-slate-500">Loading…</p>}
      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && details && (
        <>
          <div className="mt-3 flex items-center gap-3 text-sm rounded-md border border-slate-300 bg-slate-100 p-3">
            <FontAwesomeIcon
              icon={faUser}
              className="shrink-0 text-slate-600"
              aria-hidden="true"
            />
            <div className="text-sm text-slate-700">
              <p>{details.email}</p>
              <p>{details.description || 'No profile description yet.'}</p>
            </div>
          </div>
          <div className="mt-4">
            {details.imageUrl ? (
              <img
                src={details.imageUrl}
                alt={`${details.name}'s profile`}
                className="h-40 w-40 rounded-full border border-slate-300 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full border border-dashed border-slate-400 text-sm text-slate-500">
                No profile image
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {uploadingImage ? 'Uploading image...' : 'Upload profile image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage || removingProfileImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    void handleProfileImageSelected(file)
                    e.currentTarget.value = ''
                  }}
                />
              </label>
              {details.imageUrl ? (
                <button
                  type="button"
                  onClick={() => void handleRemoveProfileImage()}
                  disabled={removingProfileImage || uploadingImage}
                  aria-label="Remove profile picture"
                  className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                >
                  {removingProfileImage ? 'Removing…' : 'Remove image'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <FontAwesomeIcon
              icon={faUser}
              className="shrink-0 text-slate-600"
              aria-hidden="true"
            />
            <p>This is your profile.</p>
            <button
              type="button"
              onClick={() => setShowEditForm((prev) => !prev)}
              aria-label={showEditForm ? 'Hide profile edit form' : 'Show profile edit form'}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
              {showEditForm ? 'Hide edit details' : 'Edit details'}
            </button>
          </div>

          {showEditForm && (
            <section className="mt-6 rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
              <form onSubmit={handleSave} className="max-w-md space-y-4">
                {saveError && (
                  <div
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                    role="alert"
                  >
                    {saveError}
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    id="name"
                    required
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  aria-label={saving ? 'Saving profile changes' : 'Save profile changes'}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </section>
          )}

          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-slate-900">Your trips</h2>
              <Link
                to="/trips/new"
                aria-label="Create new trip"
                className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                New trip
              </Link>
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
                <ul className="mt-4 divide-y divide-slate-300 rounded-lg border border-slate-300 bg-white shadow-sm">
                  {visibleTrips.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <Link
                          to={`/trips/${t.id}`}
                          aria-label={`Open trip ${t.title}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {t.title}
                        </Link>
                        <p className="text-sm text-slate-600">
                          {formatDate(t.startDate)}
                        </p>
                      </div>
                      <Link
                        to={`/trips/${t.id}/edit`}
                        aria-label={`Edit trip ${t.title}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:underline"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                        Edit
                      </Link>
                    </li>
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
