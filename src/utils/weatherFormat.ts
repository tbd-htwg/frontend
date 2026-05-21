/** Parse yyyy-MM-dd without UTC day shift. */
export function parseForecastDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`)
}

export function weekdayAbbrev(isoDate: string): string {
  const d = parseForecastDate(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

export function formatShortCalendarDate(isoDate: string): string {
  const d = parseForecastDate(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/** Labels current conditions so they are not confused with a trip stop date. */
export function formatWeatherObservedAt(observedAt?: string): string | null {
  if (!observedAt?.trim()) return null
  const observed = new Date(observedAt)
  if (Number.isNaN(observed.getTime())) return null

  const now = new Date()
  const sameLocalDay = observed.toDateString() === now.toDateString()
  const formatted = observed.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return sameLocalDay
    ? `Current conditions · ${formatted}`
    : `Observed · ${formatted}`
}
