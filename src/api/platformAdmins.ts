import { requestJson, requestVoid } from './client'

export type PlatformAdmin = {
  id: number
  email: string
  createdAt: string
}

export function listPlatformAdmins(): Promise<PlatformAdmin[]> {
  return requestJson<PlatformAdmin[]>(
    '/admin/platform-admins',
    { method: 'GET' },
    { forceBearer: true },
  )
}

export function addPlatformAdmin(email: string): Promise<PlatformAdmin> {
  return requestJson<PlatformAdmin>(
    '/admin/platform-admins',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    { forceBearer: true },
  )
}

export function removePlatformAdmin(id: number): Promise<void> {
  return requestVoid(
    `/admin/platform-admins/${id}`,
    { method: 'DELETE' },
    { forceBearer: true },
  )
}
