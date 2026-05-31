import { useEffect, useId, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendar,
  faChevronDown,
  faHeart,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export type FeedMode = 'latest' | 'recommended' | 'liked'

type FeedModeOption = {
  value: FeedMode
  label: string
  icon: IconDefinition
  requiresAuth?: boolean
}

const FEED_MODE_OPTIONS: FeedModeOption[] = [
  { value: 'latest', label: 'Latest trips', icon: faCalendar },
  {
    value: 'recommended',
    label: 'Recommended for you',
    icon: faWandMagicSparkles,
    requiresAuth: true,
  },
  { value: 'liked', label: 'Trips you liked', icon: faHeart, requiresAuth: true },
]

type FeedModeToggleProps = {
  feedMode: FeedMode
  onFeedModeChange: (mode: FeedMode) => void
  disabledPersonalised?: boolean
}

export function FeedModeToggle({
  feedMode,
  onFeedModeChange,
  disabledPersonalised = false,
}: FeedModeToggleProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const selected =
    FEED_MODE_OPTIONS.find((option) => option.value === feedMode) ??
    FEED_MODE_OPTIONS[0]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const choose = (option: FeedModeOption) => {
    if (disabledPersonalised && option.requiresAuth) return
    onFeedModeChange(option.value)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative inline-flex items-center gap-2 text-sm text-slate-700">
      <span className="shrink-0 font-medium">Show</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-w-[12rem] items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm hover:bg-slate-50 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      >
        <span className="inline-flex items-center gap-1.5">
          <FontAwesomeIcon icon={selected.icon} className="h-3.5 w-3.5" aria-hidden="true" />
          {selected.label}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`h-3 w-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Feed filter"
          className="absolute right-0 top-full z-20 mt-1 min-w-full overflow-hidden rounded-md border border-slate-300 bg-white py-1 shadow-lg"
        >
          {FEED_MODE_OPTIONS.map((option) => {
            const disabled = disabledPersonalised && option.requiresAuth === true
            const isSelected = option.value === feedMode
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={disabled}
                  title={
                    disabled
                      ? option.value === 'recommended'
                        ? 'Sign in to see personalized recommendations'
                        : 'Sign in to see trips you liked'
                      : undefined
                  }
                  onClick={() => choose(option)}
                  className={`flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-700'
                  } ${disabled ? 'cursor-not-allowed text-slate-400' : 'hover:bg-slate-50'}`}
                >
                  <FontAwesomeIcon icon={option.icon} className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{option.label}</span>
                  {disabled && <span className="ml-auto text-xs">Sign in</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
