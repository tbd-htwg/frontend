import type { TransportDistanceLegResponse } from '../types/api'

function modeLabel(mode: string): string {
  switch (mode.toUpperCase()) {
    case 'DRIVE':
      return 'Driving'
    case 'TRANSIT':
      return 'Transit'
    case 'WALK':
      return 'Walking'
    case 'BICYCLE':
      return 'Cycling'
    default:
      return mode
  }
}

export function TransportDistanceInfo({
  legs,
  loading,
  error,
}: {
  legs?: TransportDistanceLegResponse[]
  loading?: boolean
  error?: string
}) {
  if (loading && (!legs || legs.length === 0)) {
    return (
      <p className="mt-2 text-xs italic text-slate-600">Loading route distance...</p>
    )
  }
  if (error && (!legs || legs.length === 0)) {
    return <p className="mt-2 text-xs text-slate-500">{error}</p>
  }
  if (!legs || legs.length === 0) {
    return null
  }
  return (
    <ul className="mt-2 space-y-1 text-xs text-slate-700">
      {legs.map((leg) => (
        <li key={leg.mode}>
          <span className="font-medium text-slate-800">{modeLabel(leg.mode)}:</span>{' '}
          {leg.distanceText} · {leg.durationText}
        </li>
      ))}
    </ul>
  )
}
