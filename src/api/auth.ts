import type { UserResponse } from '../types/api'
import { requestJson } from './client'

export type LoginResponse = {
  tokenType: string
  accessToken: string
  user: UserResponse
}

/** Exchange a Firebase ID token (any Identity Platform provider) for an app JWT. */
export async function authFirebase(credential: string): Promise<LoginResponse> {
  return requestJson<LoginResponse>('/auth/firebase', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  }, { anonymous: true })
}

/** @deprecated Prefer {@link authFirebase}. */
export async function authGoogle(credential: string): Promise<LoginResponse> {
  return authFirebase(credential)
}

export async function authDevLogin(email: string, name?: string): Promise<LoginResponse> {
  return requestJson<LoginResponse>('/auth/dev-login', {
    method: 'POST',
    body: JSON.stringify({ email, name: name ?? '' }),
  }, { anonymous: true })
}

export async function authMe(): Promise<UserResponse> {
  return requestJson<UserResponse>('/auth/me', { method: 'GET' })
}
