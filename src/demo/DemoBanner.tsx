import { isDemoMode } from './demoMode'

export function DemoBanner() {
  if (!isDemoMode()) return null

  return (
    <span
      className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-amber-300"
      title="All tenant data is mocked in memory — no backend required"
    >
      Demo
    </span>
  )
}
