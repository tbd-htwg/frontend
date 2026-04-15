import type { CommentResponse, HalCollection, HalEntity } from '../types/api'
import { requestJson } from './client'
import {
  embeddedItems,
  hrefForResource,
  idFromEntity,
  idFromHref,
  pathFromHref,
} from './hal'

type CommentEntityBody = {
  content?: string
  createdAt?: string
}

function toComment(entity: HalEntity<CommentEntityBody>): CommentResponse {
  return {
    id: idFromEntity(entity),
    tripId: idFromHref(entity._links?.trip?.href),
    userId: idFromHref(entity._links?.user?.href),
    userName: '',
    content: entity.content ?? '',
    createdAt: entity.createdAt ?? '',
  }
}

type CommentCollection = HalCollection<HalEntity<CommentEntityBody>>

export async function listCommentsByTripId(tripId: number): Promise<CommentResponse[]> {
  const model = await requestJson<CommentCollection>(
    `/comments/search/findByTripIdOrderByCreatedAtDesc?tripId=${tripId}`,
    { method: 'GET' },
  )
  const rawComments = embeddedItems(model, 'comments')
  return Promise.all(
    rawComments.map(async (rawComment) => {
      const base = toComment(rawComment)
      const userHref = rawComment._links?.user?.href
      if (!userHref) return { ...base, userName: 'traveller' }
      const userEntity = await requestJson<HalEntity<{ name?: string }>>(
        pathFromHref(userHref),
        { method: 'GET' },
      )
      return {
        ...base,
        userId: idFromEntity(userEntity),
        userName: userEntity.name ?? 'traveller',
      }
    }),
  )
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
