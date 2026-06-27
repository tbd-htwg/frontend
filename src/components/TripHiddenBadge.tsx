import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEyeSlash } from '@fortawesome/free-solid-svg-icons'

export function TripHiddenBadge() {
  return (
    <span
      className="inline-flex shrink-0 items-center text-slate-500"
      title="Hidden from others"
      aria-label="Hidden from others"
    >
      <FontAwesomeIcon icon={faEyeSlash} className="h-4 w-4" aria-hidden="true" />
    </span>
  )
}
