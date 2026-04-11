import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTrips } from '../api/trips'
import { ApiError } from '../api/client'
import { useOwnedTripIds } from '../hooks/useOwnedTripIds'
import type { TripListItemResponse } from '../types/api'

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

export function HomePage() {
  const [trips, setTrips] = useState<TripListItemResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { ownedTripIds } = useOwnedTripIds()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listTrips()
      .then((data) => {
        if (!cancelled) setTrips(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load trips. Is the API running?',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">All trips</h1>
      <p className="mt-1 text-slate-600">
        Trips from every traveller on the platform.
      </p>

      {loading && <p className="mt-6 text-slate-500">Loading trips…</p>}
      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && trips.length === 0 && (
        <p className="mt-6 text-slate-600">No trips yet.</p>
      )}

      {!loading && !error && trips.length > 0 && (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
          {trips.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <Link
                  to={`/trips/${t.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {t.title}
                </Link>
                <p className="text-sm text-slate-600">{formatDate(t.startDate)}</p>
              </div>
              {ownedTripIds.has(t.id) && (
                <Link
                  to={`/trips/${t.id}/edit`}
                  className="text-sm font-medium text-slate-700 hover:underline"
                >
                  Edit
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
