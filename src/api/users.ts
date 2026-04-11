import type {
  UserCreateRequest,
  UserDetailsResponse,
  UserPatchRequest,
  UserPutRequest,
  UserResponse,
} from '../types/api'
import { requestJson, requestVoid } from './client'

export function listUsers(): Promise<UserResponse[]> {
  return requestJson<UserResponse[]>('/v1/users', { method: 'GET' })
}

export function registerUser(body: UserCreateRequest): Promise<UserResponse> {
  return requestJson<UserResponse>('/v1/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getUserById(id: number): Promise<UserDetailsResponse> {
  return requestJson<UserDetailsResponse>(`/v1/users/${id}`, { method: 'GET' })
}

export function replaceUser(
  id: number,
  body: UserPutRequest,
): Promise<UserResponse> {
  return requestJson<UserResponse>(`/v1/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function patchUser(
  id: number,
  body: UserPatchRequest,
): Promise<UserResponse> {
  return requestJson<UserResponse>(`/v1/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteUser(id: number): Promise<void> {
  return requestVoid(`/v1/users/${id}`, { method: 'DELETE' })
}
