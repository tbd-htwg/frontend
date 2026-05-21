import { useEffect, useState } from 'react'
import { searchPlaceSuggestions } from '../api/externalInfo'
import {
  placeSearchErrorFromUnknown,
  type PlaceSearchError,
} from '../utils/placeSearchErrors'
import { useDebouncedValue } from './useDebouncedValue'

const MIN_QUERY_LEN = 2

export function usePlaceSearch(query: string, enabled: boolean) {
  const debouncedQuery = useDebouncedValue(query, 300)
  const [suggestions, setSuggestions] = useState<Awaited<ReturnType<typeof searchPlaceSuggestions>>>([])
  const [searchError, setSearchError] = useState<PlaceSearchError | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setSuggestions([])
      setSearchError(null)
      setSearching(false)
      return
    }

    const q = debouncedQuery.trim()
    if (q.length < MIN_QUERY_LEN) {
      setSuggestions([])
      setSearchError(null)
      setSearching(false)
      return
    }

    let cancelled = false
    setSearching(true)
    setSearchError(null)

    searchPlaceSuggestions(q)
      .then((hits) => {
        if (cancelled) return
        setSuggestions(hits)
        if (hits.length === 0) {
          setSearchError({
            kind: 'generic',
            message: 'No places found. Try a different spelling or a broader search.',
          })
        }
      })
      .catch((err) => {
        if (cancelled) return
        setSuggestions([])
        setSearchError(placeSearchErrorFromUnknown(err))
      })
      .finally(() => {
        if (!cancelled) setSearching(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, enabled])

  return { suggestions, searchError, searching, minQueryLen: MIN_QUERY_LEN }
}
