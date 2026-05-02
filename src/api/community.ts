import type { CommentResponse } from '../types/api'
import { requestJson } from './client'

export type TripCommunityResponse = {
  likeCount: number
  totalCommentCount: number
  /** Present only when the request is authenticated (JWT). */
  likedByCurrentUser: boolean | null
  comments: CommentResponse[]
  commentsNextCursor: string | null
  hasMoreComments: boolean
}

type TripCommentsPageResponse = {
  items: CommentResponse[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Bundled community payload: like/comment counts, first page of comments with names, optional
 * like status for the signed-in user.
 */
export async function getTripCommunity(tripId: number): Promise<TripCommunityResponse> {
  return requestJson<TripCommunityResponse>(`/trips/${tripId}/community`, { method: 'GET' })
}

export async function loadMoreTripComments(
  tripId: number,
  cursor: string,
  pageSize = 10,
): Promise<{ items: CommentResponse[]; nextCursor: string | null; hasMore: boolean }> {
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    cursor,
  })
  const page = await requestJson<TripCommentsPageResponse>(
    `/trips/${tripId}/comments?${params}`,
    { method: 'GET' },
  )
  return {
    items: page.items,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
  }
}
