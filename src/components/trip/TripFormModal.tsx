import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTrip, getTrip, patchTrip } from '../../api/trips'
import { ApiError } from '../../api/client'
import { useTripModal } from '../../context/TripModalContext'
import { useAuth } from '../../context/AuthContext'
import { Modal } from '../Modal'
import { TripForm, type TripFormValues } from '../TripForm'

export function TripFormModal() {
  const { state, closeTripModal, publishTripBaseUpdate } = useTripModal()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [initial, setInitial] = useState<TripFormValues | null>(null)
  const [initialDestinationLabel, setInitialDestinationLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allowed, setAllowed] = useState(true)

  const open = state.mode !== 'closed'
  const isCreate = state.mode === 'create'
  const isEdit = state.mode === 'edit'
  const tripId = isEdit ? state.tripId : NaN

  useEffect(() => {
    if (!open || isCreate) {
      setInitial(null)
      setInitialDestinationLabel('')
      setError(null)
      setLoading(false)
      setAllowed(true)
      return
    }

    if (!user || !Number.isFinite(tripId)) {
      setLoading(false)
      setAllowed(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setInitial(null)
    setInitialDestinationLabel('')
    setAllowed(false)

    getTrip(tripId)
      .then((t) => {
        if (cancelled) return
        const ownerId = t.authorId ?? t.userId
        const own = Number.isFinite(ownerId) && ownerId === user.id
        setAllowed(own)
        if (own) {
          setInitialDestinationLabel(t.destination ?? '')
          setInitial({
            title: t.title,
            destinationGooglePlaceId: t.destinationGooglePlaceId ?? '',
            startDate: t.startDate,
            shortDescription: t.shortDescription,
            longDescription: t.longDescription,
          })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Could not load trip.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, isCreate, tripId, user])

  async function handleCreate(values: TripFormValues) {
    if (!user) return
    const created = await createTrip({
      userId: user.id,
      title: values.title.trim(),
      destination: values.destination?.trim(),
      destinationGooglePlaceId: values.destinationGooglePlaceId.trim(),
      startDate: values.startDate,
      shortDescription: values.shortDescription.trim(),
      longDescription: values.longDescription.trim(),
    })
    closeTripModal()
    navigate(`/trips/${created.id}`, { replace: true })
  }

  async function handleEdit(values: TripFormValues) {
    if (!user || !Number.isFinite(tripId)) return
    const updated = await patchTrip(tripId, {
      userId: user.id,
      title: values.title.trim(),
      destination: values.destination?.trim(),
      destinationGooglePlaceId: values.destinationGooglePlaceId.trim(),
      startDate: values.startDate,
      shortDescription: values.shortDescription.trim(),
      longDescription: values.longDescription.trim(),
    })
    publishTripBaseUpdate({
      tripId,
      title: updated.title,
      destination: updated.destination,
      startDate: updated.startDate,
      shortDescription: updated.shortDescription,
      longDescription: updated.longDescription,
    })
    closeTripModal()
    navigate(`/trips/${tripId}`, { replace: true })
  }

  if (!open || !user) return null

  return (
    <Modal
      open={open}
      title={isCreate ? 'New trip' : 'Edit trip'}
      onClose={closeTripModal}
      maxWidth="lg"
    >
      {isEdit && loading && <p className="text-slate-500">Loading…</p>}
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {isEdit && !loading && !error && !allowed && (
        <p className="text-amber-900">You can only edit your own trips.</p>
      )}
      {isCreate && (
        <TripForm
          submitLabel="Create trip"
          onSubmit={handleCreate}
          onCancel={closeTripModal}
        />
      )}
      {isEdit && !loading && !error && initial && allowed && (
        <TripForm
          key={tripId}
          initialValues={initial}
          initialDestinationLabel={initialDestinationLabel}
          submitLabel="Save changes"
          onSubmit={handleEdit}
          onCancel={closeTripModal}
        />
      )}
    </Modal>
  )
}
