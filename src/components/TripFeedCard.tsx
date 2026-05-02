import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

/** First `max` items joined by comma; if more, append ", and N more". */
export function formatTruncatedList(items: string[], max = 3): string | null {
  if (!items.length) return null
  if (items.length <= max) return items.join(', ')
  const head = items.slice(0, max).join(', ')
  const rest = items.length - max
  return `${head}, and ${rest} more`
}

function formatDate(iso?: string) {
  if (!iso) return ''
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

function TripFeedImageCarousel({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const n = urls.length
  const safeIndex = ((index % n) + n) % n

  useEffect(() => {
    setIndex(0)
  }, [urls])

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % n)
  }, [n])

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + n) % n)
  }, [n])

  if (n === 0) return null

  return (
    <div
      className="relative mt-3 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200"
      role="region"
      aria-roledescription="carousel"
      aria-label="Trip location photos"
      onTouchStart={(e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current
        touchStartX.current = null
        const end = e.changedTouches[0]?.clientX
        if (start == null || end == null || n <= 1) return
        const dx = end - start
        if (dx < -48) goNext()
        else if (dx > 48) goPrev()
      }}
    >
      <div className="aspect-video w-full bg-slate-200">
        <img
          src={urls[safeIndex]}
          alt={`Trip photo ${safeIndex + 1} of ${n}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      {n > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" aria-hidden />
          </button>
          <div
            className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-1.5"
            aria-hidden
          >
            {urls.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === safeIndex ? 'bg-white shadow' : 'bg-white/45'}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

export type TripFeedCardProps = {
  id: number
  title: string
  shortDescription?: string
  destination?: string
  startDate?: string
  authorLabel?: string
  locations?: string[]
  accommodationNames?: string[]
  transportTypes?: string[]
  /** When true (logged-in), gallery may render if URLs are present. */
  showLocationImages?: boolean
  locationImageUrls?: string[]
}

export function TripFeedCard(props: TripFeedCardProps) {
  const metaParts: string[] = []
  if (props.destination) metaParts.push(props.destination)
  const dateStr = formatDate(props.startDate)
  if (dateStr) metaParts.push(dateStr)
  if (props.authorLabel) metaParts.push(props.authorLabel)
  const metaLine = metaParts.join(' · ')

  const locLine = formatTruncatedList(props.locations ?? [])
  const accomLine = formatTruncatedList(props.accommodationNames ?? [])
  const transLine = formatTruncatedList(props.transportTypes ?? [])

  const galleryUrls =
    props.showLocationImages && props.locationImageUrls?.length
      ? props.locationImageUrls
      : null

  return (
    <li className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <Link
          to={`/trips/${props.id}`}
          aria-label={`Open trip ${props.title}`}
          className="text-lg font-medium text-slate-900 hover:underline"
        >
          {props.title}
        </Link>
        {metaLine ? <p className="mt-1 text-sm text-slate-600">{metaLine}</p> : null}
        {props.shortDescription ? (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{props.shortDescription}</p>
        ) : null}
        {galleryUrls ? <TripFeedImageCarousel urls={galleryUrls} /> : null}
        {(locLine || accomLine || transLine) ? (
          <dl className="mt-3 space-y-1.5 text-sm">
            {locLine ? (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="shrink-0 font-medium text-slate-700">Locations</dt>
                <dd className="min-w-0 text-slate-600">{locLine}</dd>
              </div>
            ) : null}
            {accomLine ? (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="shrink-0 font-medium text-slate-700">Accommodations</dt>
                <dd className="min-w-0 text-slate-600">{accomLine}</dd>
              </div>
            ) : null}
            {transLine ? (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="shrink-0 font-medium text-slate-700">Transports</dt>
                <dd className="min-w-0 text-slate-600">{transLine}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </li>
  )
}
