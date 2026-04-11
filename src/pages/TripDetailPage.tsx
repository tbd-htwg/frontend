import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteTrip, getTrip } from '../api/trips'
import { getUserById } from '../api/users'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { TripDetailsResponse } from '../types/api'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
        const t = await getTrip(tripId)
        if (cancelled) return
        setTrip(t)
        if (user) {
          const u = await getUserById(user.id)
          if (cancelled) return
          setIsOwner(u.trips.some((x) => x.id === tripId))
        } else {
          setIsOwner(false)
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
