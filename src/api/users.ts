import type {
  HalCollection,
  HalEntity,
  SignedImageUploadRequest,
  SignedImageUploadResponse,
  UserCreateRequest,
  UserDetailsResponse,
  UserPatchRequest,
  UserPutRequest,
  UserResponse,
} from '../types/api'
import { ApiError, requestJson, requestVoid, uploadFileToSignedUrl } from './client'
import { embeddedItems, idFromEntity } from './hal'

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
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

/**
 * Indexed lookup by unique `name`. Avoids loading the entire users collection
 * just to find one user (see audit: category A, login flow).
 */
export async function findUserByName(name: string): Promise<UserResponse | null> {
  try {
    const entity = await requestJson<HalEntity<UserEntityBody>>(
      `/users/search/findByName?name=${encodeURIComponent(name)}`,
      { method: 'GET' },
    )
    return toUser(entity)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export async function getUserById(id: number): Promise<UserDetailsResponse> {
  const entity = await requestJson<HalEntity<UserEntityBody>>(`/users/${id}`, {
    method: 'GET',
  })
  return toUser(entity)
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

export function deleteUserProfileImage(userId: number): Promise<void> {
  return requestVoid(`/users/${userId}/images`, { method: 'DELETE' })
}

export async function uploadUserProfileImage(id: number, file: File): Promise<string> {
  const contentType = file.type?.trim()
  if (!contentType.startsWith('image/')) {
    throw new Error('Only image files are allowed.')
  }
  const signed = await requestJson<SignedImageUploadResponse>(`/users/${id}/images`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      contentType,
    } satisfies SignedImageUploadRequest),
  })
  await uploadFileToSignedUrl(signed.uploadUrl, file, signed.contentType)
  return signed.objectUrl
}
