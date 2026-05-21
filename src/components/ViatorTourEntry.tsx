import type { ExternalTourResponse } from '../types/api'

function tourBookingUrl(tour: ExternalTourResponse): string | undefined {
  const url = tour.url?.trim() || tour.productUrl?.trim()
  return url && url !== '#' ? url : undefined
}

function parseViatorPrice(price?: string): { amount: string; currency: string } | null {
  const raw = price?.trim()
  if (!raw) return null
  const match = raw.match(/^([\d.,]+)\s+([A-Za-z]{3})$/)
  if (match) {
    return { amount: match[1], currency: match[2] }
  }
  return { amount: raw, currency: '' }
}

export function ViatorTourEntry({ tour }: { tour: ExternalTourResponse }) {
  const href = tourBookingUrl(tour)
  const priceParts = parseViatorPrice(tour.price)
  const linkClass =
    'block rounded-sm text-blue-700 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

  const titleClass = 'line-clamp-2 text-xs font-medium leading-snug text-slate-900'
  const priceRow =
    priceParts != null ? (
      <span className="mt-1 block text-[11px] leading-tight text-slate-700">
        <span className="font-semibold tabular-nums">{priceParts.amount}</span>
        {priceParts.currency ? (
          <span className="ml-1 font-medium text-slate-600">{priceParts.currency}</span>
        ) : null}
      </span>
    ) : null

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <span
          className={`${titleClass} underline decoration-blue-700/50 underline-offset-2`}
        >
          {tour.title}
        </span>
        {priceRow}
      </a>
    )
  }

  return (
    <div>
      <span className={titleClass}>{tour.title}</span>
      {priceRow}
    </div>
  )
}

function ViatorToursPanel({ title, tours }: { title: string; tours: ExternalTourResponse[] }) {
  if (!tours.length) {
    return (
      <div className="w-full min-w-0 flex-1 rounded-md border border-slate-200 bg-blue-50 p-3">
        <p className="mb-2 text-xs font-bold text-slate-600">{title}</p>
        <p className="text-xs text-slate-500">No matching activities found.</p>
      </div>
    )
  }
  return (
    <div className="w-full min-w-0 flex-1 rounded-md border border-slate-200 bg-blue-50 p-3">
      <p className="mb-2 text-xs font-bold text-slate-600">{title}</p>
      <ul className="list-disc space-y-2.5 pl-4 marker:text-slate-500">
        {tours.map((tour) => (
          <li key={tour.id} className="pl-0.5">
            <ViatorTourEntry tour={tour} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AccommodationActivityInfo({
  info,
  loading,
  error,
}: {
  info?: { similarPriceTours: ExternalTourResponse[]; otherTours: ExternalTourResponse[] }
  loading?: boolean
  error?: string
}) {
  if (loading && !info) {
    return (
      <p className="mt-3 w-full text-sm italic text-slate-600">Loading activity suggestions...</p>
    )
  }
  if (error && !info) {
    return <p className="mt-3 w-full text-sm text-slate-500">{error}</p>
  }
  if (!info) {
    return null
  }
  const hasSimilar = info.similarPriceTours.length > 0
  const hasOther = info.otherTours.length > 0
  if (!hasSimilar && !hasOther) {
    return null
  }
  return (
    <div className="mt-3 w-full">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
        <ViatorToursPanel title="Near your budget (Viator)" tours={info.similarPriceTours} />
        <ViatorToursPanel title="More activities (Viator)" tours={info.otherTours} />
      </div>
    </div>
  )
}
