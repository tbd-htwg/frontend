import { fetchFeedLocationImageUrls } from '../api/trips'

export type FeedImagesLoadCallbacks = {
  onFirstPhase: (map: Record<number, string[]>, settledTripIds: number[]) => void
  onFullPhase?: (map: Record<number, string[]>) => void
}

/**
 * Loads feed carousel URLs in two phases: one thumbnail per trip first, then the full carousel in the background.
 */
export function loadFeedImagesPhased(
  tripIds: number[],
  callbacks: FeedImagesLoadCallbacks,
): () => void {
  if (tripIds.length === 0) {
    callbacks.onFirstPhase({}, [])
    callbacks.onFullPhase?.({})
    return () => {}
  }

  let cancelled = false

  fetchFeedLocationImageUrls(tripIds, { perTripLimit: 1 })
    .then((map) => {
      if (cancelled) return
      callbacks.onFirstPhase(map, tripIds)
    })
    .catch(() => {
      if (cancelled) return
      callbacks.onFirstPhase({}, tripIds)
    })

  const runFull = () => {
    if (cancelled) return
    fetchFeedLocationImageUrls(tripIds)
      .then((map) => {
        if (!cancelled) callbacks.onFullPhase?.(map)
      })
      .catch(() => {
        if (!cancelled) callbacks.onFullPhase?.({})
      })
  }

  if (typeof requestIdleCallback === 'function') {
    const idleId = requestIdleCallback(runFull)
    return () => {
      cancelled = true
      cancelIdleCallback(idleId)
    }
  }

  const timeoutId = window.setTimeout(runFull, 0)
  return () => {
    cancelled = true
    window.clearTimeout(timeoutId)
  }
}

/** Per-card skeleton until the first-phase response has settled for that trip id. */
export function isFeedImageLoadingForTrip(
  showLocationImages: boolean,
  settledTripIds: ReadonlySet<number>,
  tripId: number,
): boolean {
  return showLocationImages && !settledTripIds.has(tripId)
}
