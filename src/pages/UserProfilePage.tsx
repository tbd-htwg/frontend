import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faUser } from '@fortawesome/free-solid-svg-icons'
import { ApiError } from '../api/client'
import { getUserById } from '../api/users'
import { useAuth } from '../context/AuthContext'
import type { UserDetailsResponse } from '../types/api'

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

export function UserProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const userId = id ? Number(id) : NaN
  const [profile, setProfile] = useState<UserDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(userId)) {
      setError('Invalid user id.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getUserById(userId)
      .then((data) => {
        if (!cancelled) setProfile(data)
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
  }, [userId])

  if (!Number.isFinite(userId)) return <p className="text-red-800">Invalid user.</p>

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
          <h1 className="text-2xl font-semibold text-slate-900">{profile.name}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm rounded-md border border-slate-300 bg-slate-100 p-3">
            <FontAwesomeIcon
              icon={faUser}
              className="shrink-0 text-slate-600"
              aria-hidden="true"
            />
            <div className="text-sm text-slate-700">
              <p>{profile.email}</p>
              <p>{profile.description || 'No profile description yet.'}</p>
            </div>
          </div>
          {user?.id === profile.id && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <FontAwesomeIcon
                icon={faUser}
                className="shrink-0 text-slate-600"
                aria-hidden="true"
              />
              <p>This is your profile.</p>
              <Link
                to="/profile"
                aria-label="Edit your profile"
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                Edit details
              </Link>
            </div>
          )}
          <section className="mt-8">
            <h2 className="text-lg font-medium text-slate-900">Trips by {profile.name}</h2>
            {profile.trips.length === 0 ? (
              <p className="mt-3 text-slate-600">No trips yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-300 rounded-lg border border-slate-300 bg-white shadow-sm">
                {profile.trips.map((trip) => (
                  <li
                    key={trip.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <Link
                        to={`/trips/${trip.id}`}
                        aria-label={`Open trip ${trip.title}`}
                        className="font-medium hover:underline"
                      >
                        {trip.title}
                      </Link>
                      <p className="text-sm text-slate-600">{formatDate(trip.startDate)}</p>
                    </div>
                    {user?.id === profile.id && (
                      <Link
                        to={`/trips/${trip.id}/edit`}
                        aria-label={`Edit trip ${trip.title}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:underline"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                        Edit
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
