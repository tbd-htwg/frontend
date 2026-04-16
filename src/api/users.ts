import type {
  HalCollection,
  HalEntity,
  UserCreateRequest,
  UserDetailsResponse,
  UserPatchRequest,
  UserPutRequest,
  UserResponse,
} from '../types/api'
import { requestJson, requestVoid } from './client'
import { embeddedItems, idFromEntity } from './hal'
import { listAllTripsByUserId } from './trips'

type UserEntityBody = {
  email?: string
  name?: string
  imageUrl?: string
  description?: string
}

function toUser(entity: HalEntity<UserEntityBody>): UserResponse {
  return {
    id: idFromEntity(entity),
    email: entity.email ?? '',
    name: entity.name ?? '',
    imageUrl: entity.imageUrl ?? '',
    description: entity.description ?? '',
  }
}

type UserCollection = HalCollection<HalEntity<UserEntityBody>>

export async function listUsers(): Promise<UserResponse[]> {
  const model = await requestJson<UserCollection>('/users', { method: 'GET' })
  return embeddedItems(model, 'users').map(toUser)
}

export async function registerUser(body: UserCreateRequest): Promise<UserResponse> {
  const entity = await requestJson<HalEntity<UserEntityBody>>('/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return toUser(entity)
}

export async function findUserByEmail(email: string): Promise<UserResponse | null> {
  try {
    const entity = await requestJson<HalEntity<UserEntityBody>>(
      `/users/search/findByEmail?email=${encodeURIComponent(email)}`,
      { method: 'GET' },
    )
    return toUser(entity)
  } catch {
    return null
  }
}

export async function getUserById(id: number): Promise<UserDetailsResponse> {
  const [entity, trips] = await Promise.all([
    requestJson<HalEntity<UserEntityBody>>(`/users/${id}`, { method: 'GET' }),
    listAllTripsByUserId(id),
  ])
  return {
    ...toUser(entity),
    trips,
  }
}

export async function replaceUser(
  id: number,
  body: UserPutRequest,
): Promise<UserResponse> {
  const entity = await requestJson<HalEntity<UserEntityBody>>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return toUser(entity)
}

export async function patchUser(
  id: number,
  body: UserPatchRequest,
): Promise<UserResponse> {
  const entity = await requestJson<HalEntity<UserEntityBody>>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return toUser(entity)
}

export function deleteUser(id: number): Promise<void> {
  return requestVoid(`/users/${id}`, { method: 'DELETE' })
}
