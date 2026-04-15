import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getUserById, patchUser } from '../api/users'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { UserDetailsResponse } from '../types/api'

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export function ProfilePage() {
  const { user, updateSessionUser } = useAuth()
  const [details, setDetails] = useState<UserDetailsResponse | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    getUserById(user.id)
      .then((d) => {
        if (!cancelled) {
          setDetails(d)
          setEmail(d.email)
          setName(d.name)
          setDescription(d.description)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load your profile.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaveError(null)
    setSaving(true)
    try {
      const updated = await patchUser(user.id, {
        email: email.trim(),
        name: name.trim(),
        description: description.trim(),
      })
      updateSessionUser(updated)
      const fresh = await getUserById(user.id)
      setDetails(fresh)
      setEmail(fresh.email)
      setName(fresh.name)
      setDescription(fresh.description)
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Could not update profile.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Your profile</h1>
      <p className="mt-1 text-slate-600">Signed in as {user.name} (id {user.id}).</p>

      {loading && <p className="mt-6 text-slate-500">Loading…</p>}
      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && details && (
        <>
          <section className="mt-8 rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900">Edit details</h2>
            <div className="mt-4 flex items-center gap-3 rounded-md border border-slate-300 bg-slate-100 p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-xl">
                👤
              </div>
              <div className="text-sm text-slate-700">
                <p className="font-medium">Profile image placeholder</p>
                <p>Image upload will be enabled once backend upload APIs are available.</p>
              </div>
              <button
                type="button"
                disabled
                className="ml-auto rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500"
              >
                Upload image (coming soon)
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-4 max-w-md space-y-4">
              {saveError && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {saveError}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  id="name"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-slate-900">Your trips</h2>
              <Link
                to="/trips/new"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                New trip
              </Link>
            </div>
            {details.trips.length === 0 ? (
              <p className="mt-4 text-slate-600">You have no trips yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-300 rounded-lg border border-slate-300 bg-white shadow-sm">
                {details.trips.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <Link
                        to={`/trips/${t.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {t.title}
                      </Link>
                      <p className="text-sm text-slate-600">
                        {formatDate(t.startDate)}
                      </p>
                    </div>
                    <Link
                      to={`/trips/${t.id}/edit`}
                      className="text-sm font-medium text-slate-700 hover:underline"
                    >
                      Edit
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
