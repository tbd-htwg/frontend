import { useEffect, useState } from 'react'
import { getUserById, patchUser } from '../../api/users'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useProfileModal } from '../../context/ProfileModalContext'
import { Modal } from '../Modal'
import { ProfileForm, type ProfileFormValues } from './ProfileForm'

export function ProfileFormModal() {
  const { state, closeProfileModal, publishProfileUpdate } = useProfileModal()
  const { user, updateSessionUser } = useAuth()

  const [initial, setInitial] = useState<ProfileFormValues | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = state.mode === 'edit'

  useEffect(() => {
    if (!open || !user) {
      setInitial(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setInitial(null)

    getUserById(user.id, true)
      .then((d) => {
        if (cancelled) return
        setInitial({
          email: d.email,
          name: d.name,
          description: d.description,
        })
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Could not load your profile.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, user])

  async function handleSave(values: ProfileFormValues) {
    if (!user) return
    const updated = await patchUser(user.id, {
      email: values.email.trim(),
      name: values.name.trim(),
      description: values.description.trim(),
    })
    updateSessionUser(updated)
    publishProfileUpdate(updated)
    closeProfileModal()
  }

  if (!open || !user) return null

  return (
    <Modal open={open} title="Edit profile" onClose={closeProfileModal} maxWidth="lg">
      {loading && <p className="text-slate-500">Loading…</p>}
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {!loading && !error && initial && (
        <ProfileForm
          key={user.id}
          initialValues={initial}
          submitLabel="Save changes"
          onSubmit={handleSave}
          onCancel={closeProfileModal}
        />
      )}
    </Modal>
  )
}
