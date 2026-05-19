import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

type TripSectionHeaderProps = {
  title: string
  count: number
  onAdd?: () => void
  addAriaLabel: string
}

export function TripSectionHeader({ title, count, onAdd, addAriaLabel }: TripSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-medium text-slate-900">{title}</h2>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">
          {count} {count === 1 ? 'entry' : 'entries'}
        </span>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            aria-label={addAriaLabel}
            className="inline-flex items-center gap-2 rounded-md border border-green-600 bg-white px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            Add
          </button>
        ) : null}
      </div>
    </div>
  )
}
