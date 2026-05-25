import type { TripFeedCardProps } from '../components/TripFeedCard'
import type { TripListItemResponse, TripSearchResult } from '../types/api'
import { isFeedImageLoadingForTrip } from './feedImages'

export type TripFeedBrowseOptions = {
  /** When set, overrides ownership derived from currentUserId. */
  isOwned?: boolean
  /** When true, authorLabel is omitted (e.g. profile trip lists). */
  omitAuthorLabel?: boolean
  /** Trip ids that finished the first-phase image fetch (per-card skeleton). */
  feedImagesSettledTripIds?: ReadonlySet<number>
}

export function tripFeedPropsFromBrowse(
  t: TripListItemResponse,
  showLocationImages: boolean,
  feedImagesByTripId: Record<number, string[]>,
  currentUserId: number | undefined,
  options?: TripFeedBrowseOptions,
): TripFeedCardProps {
  const authorId = t.authorId ?? t.userId
  const isOwned =
    options?.isOwned ??
    (currentUserId != null && authorId === currentUserId)
  return {
    id: t.id,
    title: t.title,
    shortDescription: t.shortDescription?.trim() || undefined,
    destination: t.destination,
    startDate: t.startDate,
    authorLabel: options?.omitAuthorLabel ? undefined : t.authorName,
    locations: t.locations,
    accommodationNames: t.accommodationNames,
    transportRoutes: t.transportRoutes,
    showLocationImages,
    locationImagesLoading: isFeedImageLoadingForTrip(
      showLocationImages,
      options?.feedImagesSettledTripIds ?? new Set(),
      t.id,
    ),
    locationImageUrls: feedImagesByTripId[t.id],
    isOwned,
  }
}

export function tripFeedPropsFromSearch(
  t: TripSearchResult,
  showLocationImages: boolean,
  feedImagesByTripId: Record<number, string[]>,
  currentUserId: number | undefined,
  feedImagesSettledTripIds: ReadonlySet<number> = new Set(),
): TripFeedCardProps {
  return {
    id: t.id,
    title: t.title,
    shortDescription: t.shortDescription?.trim() || undefined,
    destination: t.destination,
    startDate: t.startDate,
    authorLabel: t.author,
    locations: t.locations,
    accommodationNames: t.accommodationNames,
    transportRoutes: t.transportRoutes,
    showLocationImages,
    locationImagesLoading: isFeedImageLoadingForTrip(
      showLocationImages,
      feedImagesSettledTripIds,
      t.id,
    ),
    locationImageUrls: feedImagesByTripId[t.id],
    isOwned: currentUserId != null && t.userId === currentUserId,
  }
}
