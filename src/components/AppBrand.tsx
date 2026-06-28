import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useColorScheme } from '../context/ColorSchemeContext'
import { useBrandingStatus, useTenantBranding } from '../context/TenantBrandingContext'
import {
  APP_ICON_SRC,
  APP_INVERT_HEADER_ICON,
  APP_LOADING_TITLE,
  APP_TITLE_RETRACT_TO_INITIALS,
  appTitleInitials,
} from '../branding'
import { shouldInvertHeaderIcon } from '../lib/tenantTheme'

const RETRACT_DELAY_MS = 1000
/** Matches opacity / max-width in index.css (.app-brand__retract). */
const RETRACT_DURATION_MS = 450

type TitleSegment = {
  text: string
  isInitial: boolean
}

type AppBrandProps = {
  title?: string
  iconUrl?: string
  retractToInitials?: boolean
  invertHeaderIcon?: boolean
  primaryColor?: string | null
  /** When true, render as a non-link preview (admin overview). */
  preview?: boolean
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

function BrandSkeleton() {
  return (
    <span
      className="inline-flex animate-pulse items-center gap-2"
      aria-hidden="true"
    >
      <span className="inline-block h-7 w-7 shrink-0 rounded bg-slate-200/90" />
      <span className="inline-block h-5 w-28 rounded bg-slate-200/90" />
      <span className="sr-only">Loading tenant branding</span>
    </span>
  )
}

export function AppBrand({
  title: titleOverride,
  iconUrl: iconUrlOverride,
  retractToInitials: retractOverride,
  invertHeaderIcon: invertHeaderIconOverride,
  primaryColor: primaryColorOverride,
  preview = false,
}: AppBrandProps = {}) {
  const branding = useTenantBranding()
  const brandingStatus = useBrandingStatus()
  const { colorScheme } = useColorScheme()
  const hasExplicitBranding = titleOverride !== undefined || iconUrlOverride !== undefined
  const showSkeleton = !preview && !hasExplicitBranding && brandingStatus === 'pending'

  const title = titleOverride ?? branding.title
  const iconUrl = iconUrlOverride ?? branding.iconUrl ?? APP_ICON_SRC
  const primaryColor = primaryColorOverride ?? branding.primaryColor
  const invertHeaderIcon =
    invertHeaderIconOverride ??
    branding.invertHeaderIcon ??
    (branding.slug === 'free' ? APP_INVERT_HEADER_ICON : false)
  const retractToInitials =
    retractOverride ??
    branding.titleRetractToInitials ??
    (branding.slug === 'free' ? APP_TITLE_RETRACT_TO_INITIALS : false)

  const invertIcon = shouldInvertHeaderIcon(invertHeaderIcon, primaryColor, colorScheme)

  const initials = appTitleInitials(title)
  const segments = useMemo(
    () => (retractToInitials ? segmentsForRetractAnimation(title) : []),
    [retractToInitials, title],
  )

  const [expanded, setExpanded] = useState(retractToInitials ? true : false)

  useEffect(() => {
    if (preview) return
    if (showSkeleton) {
      document.title = APP_LOADING_TITLE
      return
    }
    document.title = title
    if (!retractToInitials) return

    const retractTimer = window.setTimeout(() => {
      setExpanded(false)
    }, RETRACT_DELAY_MS)

    return () => window.clearTimeout(retractTimer)
  }, [preview, retractToInitials, showSkeleton, title])

  useEffect(() => {
    if (preview || showSkeleton || !retractToInitials || expanded) return

    const settleTimer = window.setTimeout(() => {
      document.title = initials
    }, RETRACT_DURATION_MS)

    return () => window.clearTimeout(settleTimer)
  }, [expanded, initials, preview, retractToInitials, showSkeleton, title])

  useEffect(() => {
    if (showSkeleton) return
    setExpanded(retractToInitials ? true : false)
  }, [retractToInitials, showSkeleton, title])

  const className =
    'inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-inherit'

  if (showSkeleton) {
    return (
      <span className={className} aria-busy="true">
        <BrandSkeleton />
      </span>
    )
  }

  const content = (
    <>
      <img
        src={iconUrl}
        alt=""
        className={`h-7 w-7 shrink-0${invertIcon ? ' invert' : ''}`}
        width={28}
        height={28}
        aria-hidden="true"
      />
      {retractToInitials ? (
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
    </>
  )

  if (preview) {
    return (
      <div aria-label={`${title} branding preview`} className={className}>
        {content}
      </div>
    )
  }

  return (
    <Link to="/" aria-label={`${title} home`} className={className}>
      {content}
    </Link>
  )
}
