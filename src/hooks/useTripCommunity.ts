import { useEffect, useState } from 'react'

import { getTripCommunity } from '../api/community'
import { ApiError } from '../api/client'
import { loadSlice, sliceErrorMessage } from '../api/loadSlice'
import type { CommentResponse } from '../types/api'
import type { SliceStatus } from './useTripDetailCore'

export function useTripCommunity(tripId: number, enabled: boolean) {
  const [status, setStatus] = useState<SliceStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [likeCount, setLikeCount] = useState(0)
  const [likedByMe, setLikedByMe] = useState(false)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [commentsNextCursor, setCommentsNextCursor] = useState<string | null>(null)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [totalCommentCount, setTotalCommentCount] = useState(0)

  useEffect(() => {
    if (!enabled || !Number.isFinite(tripId)) {
      setStatus('idle')
      setError(null)
      return
    }

    let cancelled = false
    setStatus('loading')
    setError(null)

    void (async () => {
      const result = await loadSlice(() => getTripCommunity(tripId))
      if (cancelled) return

      if (result.ok) {
        const community = result.data
        setComments(community.comments)
        setCommentsNextCursor(community.commentsNextCursor ?? null)
        setHasMoreComments(community.hasMoreComments)
        setTotalCommentCount(community.totalCommentCount)
        setLikeCount(community.likeCount)
        setLikedByMe(community.likedByCurrentUser ?? false)
        setStatus('success')
        setError(null)
      } else {
        setStatus('error')
        setError(
          result.error instanceof ApiError
            ? result.error.message
            : sliceErrorMessage(result.error, 'Community data is unavailable.'),
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tripId, enabled])

  return {
    status,
    error,
    communityLoading: status === 'loading',
    communityReady: status === 'success',
    communityFailed: status === 'error',
    likeCount,
    setLikeCount,
    likedByMe,
    setLikedByMe,
    comments,
    setComments,
    commentsNextCursor,
    setCommentsNextCursor,
    hasMoreComments,
    setHasMoreComments,
    totalCommentCount,
    setTotalCommentCount,
  }
}
