import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { listTrips, searchTrips } from '../api/trips'
import { ApiError } from '../api/client'
import { PaginationControls } from '../components/PaginationControls'
import { useAuth } from '../context/AuthContext'
import type { PaginatedResponse, TripListItemResponse, TripSearchResult } from '../types/api'

const PAGE_SIZE = 10

function isCurrentUserTrip(
  user: { id: number } | null,
  trip: { userId?: number },
): boolean {
  return user != null && trip.userId != null && trip.userId === user.id
}

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
  const [browsePage, setBrowsePage] = useState<PaginatedResponse<TripListItemResponse> | null>(
    null,
  )
  const [searchPage, setSearchPage] = useState<PaginatedResponse<TripSearchResult> | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setDebouncedQuery('')
      return
    }
    const t = window.setTimeout(() => setDebouncedQuery(q), 300)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  useEffect(() => {
    const q = query.trim()
    if (q && q !== debouncedQuery) {
      setLoading(true)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setBrowsePage(null)
    setSearchPage(null)

    if (debouncedQuery.trim()) {
      searchTrips(debouncedQuery, currentPage, PAGE_SIZE)
        .then((data) => {
          if (!cancelled) setSearchPage(data)
        })
        .catch((err) => {
          if (!cancelled) {
            setError(
              err instanceof ApiError
                ? err.message
                : 'Could not search trips. Is the API running?',
            )
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
      return () => {
        cancelled = true
      }
    }

    listTrips(currentPage, PAGE_SIZE)
      .then((data) => {
        if (!cancelled) setBrowsePage(data)
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
  }, [currentPage, query, debouncedQuery])

  const showSearch = Boolean(debouncedQuery.trim())
  const searchItems = searchPage?.items ?? []
  const browseItems = browsePage?.items ?? []
  const visibleTrips = showSearch ? searchItems : browseItems

  const pageMeta = showSearch ? searchPage : browsePage
  const totalPages = pageMeta?.totalPages ?? 1
  const totalTrips = pageMeta?.totalItems ?? 0
  const listPageSize = showSearch ? pageMeta?.pageSize ?? PAGE_SIZE : PAGE_SIZE

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">All trips</h1>
      <p className="mt-1 text-slate-600">
        Trips from every traveller on the platform.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trips (title, description, places, transport, …)"
          aria-label="Search trips by text"
          className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {loading && <p className="mt-6 text-slate-500">Loading trips…</p>}
      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && visibleTrips.length === 0 && (
        <p className="mt-6 text-slate-600">
          {showSearch ? 'No trips match your search.' : 'No trips yet.'}
        </p>
      )}

      {!loading && !error && visibleTrips.length > 0 && (
        <>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={listPageSize}
            totalItems={totalTrips}
            itemLabel="trips"
            onPageChange={setCurrentPage}
          />
          <ul className="mt-6 divide-y divide-slate-300 rounded-lg border border-slate-300 bg-white shadow-sm">
            {showSearch
              ? searchItems.map((t) => (
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
                        {t.author}
                        {t.locations && t.locations.length > 0
                          ? ` · ${t.locations.join(', ')}`
                          : null}
                      </p>
                      {t.shortDescription ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {t.shortDescription}
                        </p>
                      ) : null}
                    </div>
                    {isCurrentUserTrip(user, t) && (
                      <Link
                        to={`/trips/${t.id}/edit`}
                        aria-label={`Edit trip ${t.title}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:underline"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                        Edit
                      </Link>
                    )}
                  </li>
                ))
              : browseItems.map((t) => (
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
                        {t.destination} · {formatDate(t.startDate)}
                      </p>
                    </div>
                    {isCurrentUserTrip(user, t) && (
                      <Link
                        to={`/trips/${t.id}/edit`}
                        aria-label={`Edit trip ${t.title}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:underline"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                        Edit
                      </Link>
                    )}
                  </li>
                ))}
          </ul>
        </>
      )}
    </div>
  )
}
