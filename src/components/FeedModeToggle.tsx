import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendar, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'

type FeedModeToggleProps = {
  feedMode: 'latest' | 'recommended'
  onFeedModeChange: (mode: 'latest' | 'recommended') => void
  disabledRecommended?: boolean
}

export function FeedModeToggle({
  feedMode,
  onFeedModeChange,
  disabledRecommended = false,
}: FeedModeToggleProps) {
  return (
    <div
      className="flex overflow-hidden rounded-md border border-slate-300 text-sm"
      role="group"
      aria-label="Feed sort order"
    >
      <button
        type="button"
        onClick={() => onFeedModeChange('latest')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
          feedMode === 'latest'
            ? 'bg-slate-800 text-white'
            : 'bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <FontAwesomeIcon icon={faCalendar} className="h-3.5 w-3.5" aria-hidden="true" />
        Latest
      </button>
      <button
        type="button"
        onClick={() => !disabledRecommended && onFeedModeChange('recommended')}
        disabled={disabledRecommended}
        title={
          disabledRecommended
            ? 'Sign in to see personalized recommendations'
            : undefined
        }
        className={`inline-flex items-center gap-1.5 border-l border-slate-300 px-3 py-1.5 transition-colors ${
          feedMode === 'recommended'
            ? 'bg-slate-800 text-white'
            : disabledRecommended
              ? 'cursor-not-allowed bg-white text-slate-400'
              : 'bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <FontAwesomeIcon
          icon={faWandMagicSparkles}
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
        Recommended
      </button>
    </div>
  )
}
