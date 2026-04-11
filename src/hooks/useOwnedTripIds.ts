import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getUserById } from '../api/users'
import { useAuth } from '../context/AuthContext'

/** Trip IDs owned by the logged-in user (from GET /v1/users/{id}). */
export function useOwnedTripIds() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [ownedTripIds, setOwnedTripIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setOwnedTripIds(new Set())
      return
    }
    let cancelled = false
    setLoading(true)
    getUserById(user.id)
      .then((details) => {
        if (!cancelled) {
          setOwnedTripIds(new Set(details.trips.map((t) => t.id)))
        }
      })
      .catch(() => {
        if (!cancelled) setOwnedTripIds(new Set())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, pathname])

  return { ownedTripIds, loading }
}
