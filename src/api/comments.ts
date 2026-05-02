import type { CommentResponse, HalCollection, HalEntity } from '../types/api'
import { requestJson, requestVoid } from './client'
import {
  documentIdFromSelfHref,
  embeddedItems,
  hrefForResource,
  idFromHref,
} from './hal'

type CommentEntityBody = {
  content?: string
  createdAt?: string
  userName?: string
}

function toComment(entity: HalEntity<CommentEntityBody>): CommentResponse {
  return {
    id: documentIdFromSelfHref(entity._links?.self?.href),
    tripId: idFromHref(entity._links?.trip?.href),
    userId: idFromHref(entity._links?.user?.href),
    userName: entity.userName ?? '',
    content: entity.content ?? '',
    createdAt: entity.createdAt ?? '',
  }
}

type CommentCollection = HalCollection<HalEntity<CommentEntityBody>>

/**
 * HAL search endpoint (paginated). Prefer {@link getTripCommunity} on the trip detail page.
 * User display names are included by the backend (no N+1 user fetches).
 */
export async function listCommentsByTripId(
  tripId: number,
  size = 10,
): Promise<CommentResponse[]> {
  const model = await requestJson<CommentCollection>(
    `/comments/search/findByTripIdOrderByCreatedAtDesc?tripId=${tripId}&size=${size}`,
    { method: 'GET' },
  )
  const rawComments = embeddedItems(model, 'comments')
  return rawComments.map((raw) => toComment(raw))
}

export async function createComment(
  tripId: number,
  userId: number,
  content: string,
): Promise<CommentResponse> {
  const entity = await requestJson<HalEntity<CommentEntityBody>>('/comments', {
    method: 'POST',
    body: JSON.stringify({
      content,
      createdAt: new Date().toISOString(),
      trip: hrefForResource(`/trips/${tripId}`),
      user: hrefForResource(`/users/${userId}`),
    }),
  })
  return toComment(entity)
}

export async function deleteComment(commentId: string): Promise<void> {
  const encoded = encodeURIComponent(commentId)
  await requestVoid(`/comments/${encoded}`, { method: 'DELETE' })
}
