import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useTripModal } from '../context/TripModalContext'

/** Opens create-trip modal and lands on home (bookmark compatibility). */
export function TripNewRedirect() {
  const { openCreateTrip } = useTripModal()

  useEffect(() => {
    openCreateTrip()
  }, [openCreateTrip])

  return <Navigate to="/" replace />
}
