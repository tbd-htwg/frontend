import { useState, type FormEvent } from 'react'

export type TripFormValues = {
  title: string
  destination: string
  startDate: string
  shortDescription: string
  longDescription: string
}

const emptyValues: TripFormValues = {
  title: '',
  destination: '',
  startDate: '',
  shortDescription: '',
  longDescription: '',
}

type TripFormProps = {
  initialValues?: Partial<TripFormValues>
  submitLabel: string
  onSubmit: (values: TripFormValues) => Promise<void>
  onCancel?: () => void
}

export function TripForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: TripFormProps) {
  const [values, setValues] = useState<TripFormValues>(() => ({
    ...emptyValues,
    ...initialValues,
  }))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (values.shortDescription.length > 80) {
      setError('Short description must be at most 80 characters.')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          id="title"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
        />
      </div>
      <div>
        <label
          htmlFor="destination"
          className="block text-sm font-medium text-slate-700"
        >
          Destination
        </label>
        <input
          id="destination"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          value={values.destination}
          onChange={(e) =>
            setValues((v) => ({ ...v, destination: e.target.value }))
          }
        />
      </div>
      <div>
        <label
          htmlFor="startDate"
          className="block text-sm font-medium text-slate-700"
        >
          Start date
        </label>
        <input
          id="startDate"
          type="date"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          value={values.startDate}
          onChange={(e) =>
            setValues((v) => ({ ...v, startDate: e.target.value }))
          }
        />
      </div>
      <div>
        <label
          htmlFor="shortDescription"
          className="block text-sm font-medium text-slate-700"
        >
          Short description (max 80 characters)
        </label>
        <input
          id="shortDescription"
          required
          maxLength={80}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          value={values.shortDescription}
          onChange={(e) =>
            setValues((v) => ({ ...v, shortDescription: e.target.value }))
          }
        />
        <p className="mt-1 text-xs text-slate-500">
          {values.shortDescription.length} / 80
        </p>
      </div>
      <div>
        <label
          htmlFor="longDescription"
          className="block text-sm font-medium text-slate-700"
        >
          Detail description
        </label>
        <textarea
          id="longDescription"
          required
          rows={6}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          value={values.longDescription}
          onChange={(e) =>
            setValues((v) => ({ ...v, longDescription: e.target.value }))
          }
        />
      </div>
      <div className="rounded-md border border-slate-300 bg-slate-100 px-3 py-3 text-sm text-slate-700">
        <p className="font-medium text-slate-800">
          Refine your travel diary to connect to others
        </p>
        <p className="mt-1">
          Details like travelled locations, accommodations, and transport can be added
          after the trip was created.
        </p>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          aria-label={submitting ? 'Saving trip' : submitLabel}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel trip editing"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
