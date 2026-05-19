import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { UserResponse } from '../types/api'

type ProfileModalState = { mode: 'closed' } | { mode: 'edit' }

type ProfileModalContextValue = {
  state: ProfileModalState
  openEditProfile: () => void
  closeProfileModal: () => void
  profileSaveRevision: number
  lastProfileUpdate: UserResponse | null
  publishProfileUpdate: (update: UserResponse) => void
}

const ProfileModalContext = createContext<ProfileModalContextValue | null>(null)

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfileModalState>({ mode: 'closed' })
  const [profileSaveRevision, setProfileSaveRevision] = useState(0)
  const [lastProfileUpdate, setLastProfileUpdate] = useState<UserResponse | null>(null)

  const openEditProfile = useCallback(() => setState({ mode: 'edit' }), [])
  const closeProfileModal = useCallback(() => setState({ mode: 'closed' }), [])

  const publishProfileUpdate = useCallback((update: UserResponse) => {
    setLastProfileUpdate(update)
    setProfileSaveRevision((r) => r + 1)
  }, [])

  const value = useMemo(
    () => ({
      state,
      openEditProfile,
      closeProfileModal,
      profileSaveRevision,
      lastProfileUpdate,
      publishProfileUpdate,
    }),
    [
      state,
      openEditProfile,
      closeProfileModal,
      profileSaveRevision,
      lastProfileUpdate,
      publishProfileUpdate,
    ],
  )

  return (
    <ProfileModalContext.Provider value={value}>{children}</ProfileModalContext.Provider>
  )
}

export function useProfileModal() {
  const ctx = useContext(ProfileModalContext)
  if (!ctx) {
    throw new Error('useProfileModal must be used within ProfileModalProvider')
  }
  return ctx
}
