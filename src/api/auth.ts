import type { UserResponse } from '../types/api'
import { requestJson } from './client'

export type LoginResponse = {
  tokenType: string
  accessToken: string
  user: UserResponse
}

export async function authRegister(body: {
  email: string
  name: string
  imageUrl?: string
  description?: string
}): Promise<LoginResponse> {
  return requestJson<LoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: body.email,
      name: body.name,
      imageUrl: body.imageUrl ?? '',
      description: body.description ?? '',
    }),
  })
}

export async function authGoogle(credential: string): Promise<LoginResponse> {
  return requestJson<LoginResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}

export async function authDevLogin(email: string, name?: string): Promise<LoginResponse> {
  return requestJson<LoginResponse>('/auth/dev-login', {
    method: 'POST',
    body: JSON.stringify({ email, name: name ?? '' }),
  })
}

export async function authMe(): Promise<UserResponse> {
  return requestJson<UserResponse>('/auth/me', { method: 'GET' })
}
