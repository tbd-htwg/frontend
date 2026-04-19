import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getTrip, getTripOwner, replaceTrip } from '../api/trips'
import { ApiError } from '../api/client'
import { TripForm, type TripFormValues } from '../components/TripForm'
import { useAuth } from '../context/AuthContext'

export function TripEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tripId = id ? Number(id) : NaN

  const [initial, setInitial] = useState<TripFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (!user || !Number.isFinite(tripId)) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setInitial(null)
    setAllowed(false)

    Promise.all([getTrip(tripId), getTripOwner(tripId)])
      .then(([t, owner]) => {
        if (cancelled) return
        const own = owner.id === user.id
        setAllowed(own)
        if (own) {
          setInitial({
            title: t.title,
            destination: t.destination,
            startDate: t.startDate,
            shortDescription: t.shortDescription,
            longDescription: t.longDescription,
          })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load trip.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tripId, user])

  if (!user) return <Navigate to="/login" replace />

  if (!Number.isFinite(tripId)) {
    return <p className="text-red-800">Invalid trip.</p>
  }

  if (!loading && !error && !allowed && initial === null) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
        <p>You can only edit your own trips.</p>
        <Link
          to={`/trips/${tripId}`}
          aria-label="Open trip details"
          className="mt-2 inline-block font-medium underline"
        >
          View trip
        </Link>
      </div>
    )
  }

  async function handleSubmit(values: TripFormValues) {
    if (!user) return
    await replaceTrip(tripId, {
      userId: user.id,
      title: values.title.trim(),
      destination: values.destination.trim(),
      startDate: values.startDate,
      shortDescription: values.shortDescription.trim(),
      longDescription: values.longDescription.trim(),
    })
    navigate(`/trips/${tripId}`, { replace: true })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Edit trip</h1>
      {loading && <p className="mt-6 text-slate-500">Loading…</p>}
      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {!loading && !error && initial && allowed && (
        <div className="mt-8">
          <TripForm
            key={tripId}
            initialValues={initial}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/trips/${tripId}`)}
          />
        </div>
      )}
    </div>
  )
}
