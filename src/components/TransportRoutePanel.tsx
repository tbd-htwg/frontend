import { faSignsPost } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { TransportRouteEntry } from '../hooks/useTransportRoute'
import type { TransportResponse, TransportTravelMode } from '../types/api'
import { ROUTE_MODE_HINT } from '../utils/transportRouteErrors'
import { TransportRouteMap } from './TransportRouteMap'

const MODES: { mode: TransportTravelMode; label: string }[] = [
  { mode: 'DRIVE', label: 'Driving' },
  { mode: 'WALK', label: 'Walking' },
  { mode: 'BICYCLE', label: 'Cycling' },
  { mode: 'TRANSIT', label: 'Transit' },
]

function hasValidCoords(lat?: number, lon?: number): boolean {
  return lat != null && lon != null && (lat !== 0 || lon !== 0)
}

function RouteStatusMessage({ entry }: { entry: TransportRouteEntry }) {
  if (entry.status === 'loading' && !entry.route) {
    return <p className="text-xs italic text-slate-600">Loading route…</p>
  }
  if (!entry.errorMessage || entry.route) {
    return null
  }

  const isUnavailable = entry.errorKind === 'unavailable'

  return (
    <div
      className={`rounded-md border px-3 py-2 text-xs ${
        isUnavailable
          ? 'border-amber-300 bg-amber-50 text-amber-950'
          : 'border-slate-200 bg-slate-50 text-slate-700'
      }`}
      role="status"
    >
      {isUnavailable ? (
        <>
          <p className="font-medium text-slate-900">Routes service problem</p>
          <p className="mt-1">{entry.errorMessage}</p>
        </>
      ) : (
        <div className="flex gap-2">
          <FontAwesomeIcon
            icon={faSignsPost}
            className="mt-0.5 shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-medium text-slate-900">No route for this mode</p>
            <p className="mt-1">{entry.errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function TransportRoutePanel({
  transport,
  entry,
  onModeChange,
}: {
  transport: TransportResponse
  entry?: TransportRouteEntry
  onModeChange: (mode: TransportTravelMode) => void
}) {
  const canRoute =
    hasValidCoords(transport.startLatitude, transport.startLongitude) &&
    hasValidCoords(transport.endLatitude, transport.endLongitude)

  if (!canRoute) {
    return null
  }

  const selectedMode = entry?.selectedMode ?? 'DRIVE'
  const loading = entry?.status === 'loading'
  const route = entry?.route

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-slate-500">{ROUTE_MODE_HINT}</p>

      <div
        className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1"
        role="tablist"
        aria-label="Travel mode"
      >
        {MODES.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={selectedMode === mode}
            disabled={loading && selectedMode === mode}
            onClick={() => onModeChange(mode)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedMode === mode
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {entry ? <RouteStatusMessage entry={entry} /> : null}

      {route && (
        <p className="text-xs text-slate-700">
          <span className="font-medium text-slate-800">
            {MODES.find((m) => m.mode === route.mode)?.label ?? route.mode}:
          </span>{' '}
          {route.distanceText} · {route.durationText}
        </p>
      )}

      <div className="h-60 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <TransportRouteMap
          encodedPolyline={route?.encodedPolyline}
          startLat={transport.startLatitude as number}
          startLon={transport.startLongitude as number}
          endLat={transport.endLatitude as number}
          endLon={transport.endLongitude as number}
        />
      </div>
    </div>
  )
}
