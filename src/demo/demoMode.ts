import type { UserResponse } from '../types/api'
import { PLATFORM_ADMIN_EMAIL } from '../lib/platformAdmin'

export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true'
}

export const DEMO_ADMIN_EMAIL = PLATFORM_ADMIN_EMAIL

export const DEMO_TOKEN = 'demo-platform-admin-token'

export const DEMO_USER: UserResponse = {
  id: 0,
  email: DEMO_ADMIN_EMAIL,
  name: 'Platform Admin',
  imageUrl: '',
  description: 'Demo mode — mock platform administrator',
}
