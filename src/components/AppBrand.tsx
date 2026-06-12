import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTenantBranding } from '../context/TenantBrandingContext'
import { APP_TITLE_RETRACT_TO_INITIALS, appTitleInitials } from '../branding'

const RETRACT_DELAY_MS = 1000
/** Matches opacity / max-width in index.css (.app-brand__retract). */
const RETRACT_DURATION_MS = 450

type TitleSegment = {
  text: string
  isInitial: boolean
}

function segmentsForRetractAnimation(title: string): TitleSegment[] {
  const words = title.split(/\s+/).filter(Boolean)
  const segments: TitleSegment[] = []

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    segments.push({ text: word[0], isInitial: true })
    const trailing = word.slice(1) + (i < words.length - 1 ? ' ' : '')
    if (trailing) {
      segments.push({ text: trailing, isInitial: false })
    }
  }

  return segments
}

export function AppBrand() {
  const branding = useTenantBranding()
  const title = branding.title
  const initials = appTitleInitials(title)
  const segments = useMemo(
    () => (APP_TITLE_RETRACT_TO_INITIALS ? segmentsForRetractAnimation(title) : []),
    [title],
  )

  const [expanded, setExpanded] = useState(
    APP_TITLE_RETRACT_TO_INITIALS ? true : false,
  )

  useEffect(() => {
    document.title = title
    if (!APP_TITLE_RETRACT_TO_INITIALS) return

    const retractTimer = window.setTimeout(() => {
      setExpanded(false)
    }, RETRACT_DELAY_MS)

    return () => window.clearTimeout(retractTimer)
  }, [title])

  useEffect(() => {
    if (!APP_TITLE_RETRACT_TO_INITIALS || expanded) return

    const settleTimer = window.setTimeout(() => {
      document.title = initials
    }, RETRACT_DURATION_MS)

    return () => window.clearTimeout(settleTimer)
  }, [expanded, initials, title])

  return (
    <Link
      to="/"
      aria-label={`${title} home`}
      className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900"
    >
      <img
        src={branding.iconUrl}
        alt=""
        className="h-7 w-7 shrink-0"
        width={28}
        height={28}
        aria-hidden="true"
      />
      {APP_TITLE_RETRACT_TO_INITIALS ? (
        <span className={`text-left${expanded ? ' app-brand--expanded' : ''}`}>
          {segments.map((segment, index) =>
            segment.isInitial ? (
              <span key={index} className="app-brand__keep">
                {segment.text}
              </span>
            ) : (
              <span key={index} className="app-brand__retract whitespace-pre">
                {segment.text}
              </span>
            ),
          )}
          <span className="sr-only">{expanded ? title : initials}</span>
        </span>
      ) : (
        <span>{title}</span>
      )}
    </Link>
  )
}
