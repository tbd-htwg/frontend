import type { TripExternalInfoResponse } from '../types/api'

type LocationTravelInfoProps = {
  info?: TripExternalInfoResponse
  loading?: boolean
}

export function LocationTravelInfo({ info, loading }: LocationTravelInfoProps) {
  if (loading && !info) {
    return (
      <p className="mt-3 w-full text-sm italic text-slate-600">Loading travel information...</p>
    )
  }

  if (!info) {
    return null
  }

  const hasWeather = Boolean(info.weather)
  const hasWarning = Boolean(info.warning)
  const hasTours = Boolean(info.tours && info.tours.length > 0)

  if (!hasWeather && !hasWarning && !hasTours) {
    return null
  }

  return (
    <div className="mt-3 w-full">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
        {hasWeather && info.weather && (
          <div className="w-full min-w-0 flex-1 rounded-md border border-slate-200 bg-blue-50 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-slate-600">Weather</p>
            <div className="flex items-center gap-2">
              <div className="text-2xl shrink-0">
                {info.weather.currentWeatherCode < 3 ? '☀️' : '🌧️'}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900">{info.weather.currentTemp}°C</p>
                <p className="text-xs capitalize text-slate-600">{info.weather.currentDescription}</p>
              </div>
            </div>
          </div>
        )}
        {hasWarning && info.warning && (
          <div
            className={`w-full min-w-0 flex-1 rounded-md border p-3 text-xs ${
              info.warning.status.toLowerCase().includes('warn')
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <p className="mb-1 font-bold">Safety Update</p>
            <p className="font-medium">{info.warning.country}</p>
            <p className="mt-1 leading-relaxed">{info.warning.message}</p>
          </div>
        )}
        {hasTours && info.tours && (
          <div className="w-full min-w-0 flex-1 rounded-md border border-slate-200 bg-blue-50 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-slate-600">Activities (Viator)</p>
            <ul className="space-y-1.5">
              {info.tours.slice(0, 3).map((tour) => (
                <li key={tour.id}>
                  <a
                    href={tour.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words text-xs font-medium text-blue-700 underline hover:text-blue-900"
                  >
                    {tour.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
