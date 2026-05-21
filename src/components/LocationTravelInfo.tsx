import type {
  ExternalTravelWarning,
  ExternalWeatherData,
  StopExternalInfoResponse,
} from '../types/api'
import { flagEmojiForCountryCode } from '../utils/countryFlag'
import { weatherEmojiForCode } from '../utils/weatherEmoji'
import { formatWeatherObservedAt, weekdayAbbrev } from '../utils/weatherFormat'

type LocationTravelInfoProps = {
  info?: StopExternalInfoResponse
  loading?: boolean
  error?: string
}

function travelWarningPanelStyles(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('teilreisewarnung')) {
    return 'border-amber-300 bg-amber-50 text-amber-950'
  }
  if (s.includes('reisewarnung')) {
    return 'border-red-200 bg-red-50 text-red-800'
  }
  return 'border-slate-200 bg-slate-50 text-slate-800'
}

function travelWarningBadgeStyles(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('teilreisewarnung')) {
    return 'bg-amber-500 text-white'
  }
  if (s.includes('reisewarnung')) {
    return 'bg-red-600 text-white'
  }
  return 'bg-slate-600 text-white'
}

function TravelWarningPanel({ warning }: { warning: ExternalTravelWarning }) {
  const summary = warning.summary?.trim()
  const infoUrl = warning.infoUrl?.trim()

  return (
    <div
      className={`w-full min-w-0 flex-1 rounded-md border p-3 text-xs ${travelWarningPanelStyles(warning.status)}`}
    >
      <p className="mb-2 text-xs font-bold text-slate-700">Safety (Auswärtiges Amt)</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none" role="img" aria-hidden>
          {flagEmojiForCountryCode(warning.countryCode)}
        </span>
        <p className="text-sm font-semibold text-slate-900">{warning.countryName}</p>
      </div>
      <p className="mt-2">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${travelWarningBadgeStyles(warning.status)}`}
        >
          {warning.status}
        </span>
      </p>
      {summary ? (
        <p className="mt-2 leading-relaxed text-slate-800">{summary}</p>
      ) : null}
      {infoUrl ? (
        <p className="mt-2">
          <a
            href={infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-700 underline hover:text-blue-900"
          >
            Source
          </a>
        </p>
      ) : null}
    </div>
  )
}

function WeatherPanel({ weather }: { weather: ExternalWeatherData }) {
  const observedLabel = formatWeatherObservedAt(weather.observedAt)
  const forecasts = weather.dailyForecasts ?? []

  return (
    <div className="w-full min-w-0 flex-1 rounded-md border border-slate-200 bg-blue-50 p-3">
      <p className="mb-2 text-xs font-bold text-slate-600">Weather (Open-Meteo)</p>
      {observedLabel ? (
        <p className="mb-2 text-[11px] text-slate-600">{observedLabel}</p>
      ) : (
        <p className="mb-2 text-[11px] text-slate-600">
          Current conditions at this place (not your trip dates)
        </p>
      )}
      <div className="flex items-center gap-2">
        <div
          className="text-2xl shrink-0"
          role="img"
          aria-label={weather.currentDescription}
          title={weather.currentDescription}
        >
          {weatherEmojiForCode(weather.currentWeatherCode)}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900">{weather.currentTemp}°C</p>
          <p className="text-xs capitalize text-slate-600">{weather.currentDescription}</p>
        </div>
      </div>
      {forecasts.length > 0 ? (
        <div className="mt-3 border-t border-slate-200/80 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Forecast
          </p>
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {forecasts.map((day) => (
              <li
                key={day.date}
                className="flex flex-col items-center rounded-md bg-white/70 px-1 py-1.5 text-center"
                title={day.description}
              >
                <span className="text-[10px] font-semibold uppercase text-slate-700">
                  {weekdayAbbrev(day.date)}
                </span>
                <span className="my-0.5 text-base leading-none" aria-hidden>
                  {weatherEmojiForCode(day.weatherCode)}
                </span>
                <span className="text-[10px] font-medium text-slate-900">
                  {Math.round(day.tempMax)}°
                </span>
                <span className="text-[10px] text-slate-600">
                  {Math.round(day.tempMin)}°
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function LocationTravelInfo({ info, loading, error }: LocationTravelInfoProps) {
  if (loading && !info) {
    return (
      <p className="mt-3 w-full text-sm italic text-slate-600">Loading travel information...</p>
    )
  }

  if (error && !info) {
    return (
      <p className="mt-3 w-full text-sm text-slate-500">{error}</p>
    )
  }

  if (!info) {
    return null
  }

  const hasWeather = Boolean(info.weather)
  const hasWarning = Boolean(info.warning)

  if (!hasWeather && !hasWarning) {
    return null
  }

  return (
    <div className="mt-3 w-full">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
        {hasWeather && info.weather && <WeatherPanel weather={info.weather} />}
        {hasWarning && info.warning && <TravelWarningPanel warning={info.warning} />}
      </div>
    </div>
  )
}
