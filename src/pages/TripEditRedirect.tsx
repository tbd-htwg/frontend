import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTripModal } from '../context/TripModalContext'

/** Redirects to trip detail and opens edit modal (bookmark compatibility). */
export function TripEditRedirect() {
  const { id } = useParams()
  const tripId = id ? Number(id) : NaN
  const { openEditTrip } = useTripModal()

  useEffect(() => {
    if (Number.isFinite(tripId)) {
      openEditTrip(tripId)
    }
  }, [tripId, openEditTrip])

  if (!Number.isFinite(tripId)) {
    return <Navigate to="/" replace />
  }

  return <Navigate to={`/trips/${tripId}`} replace />
}
