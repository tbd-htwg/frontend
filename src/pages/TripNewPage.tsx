import { useNavigate } from 'react-router-dom'
import { createTrip } from '../api/trips'
import { TripForm, type TripFormValues } from '../components/TripForm'
import { useAuth } from '../context/AuthContext'

export function TripNewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  async function handleSubmit(values: TripFormValues) {
    if (!user) return
    const created = await createTrip({
      userId: user.id,
      title: values.title.trim(),
      destination: values.destination.trim(),
      startDate: values.startDate,
      shortDescription: values.shortDescription.trim(),
      longDescription: values.longDescription.trim(),
    })
    navigate(`/trips/${created.id}`, { replace: true })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">New trip</h1>
      <p className="mt-1 text-slate-600">Create a trip with transport and accommodation details.</p>
      <div className="mt-8">
        <TripForm
          submitLabel="Create trip"
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  )
}
