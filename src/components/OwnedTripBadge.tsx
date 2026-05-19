import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

export function OwnedTripBadge() {
  return (
    <span
      className="inline-flex shrink-0 items-center text-slate-500"
      title="Your trip"
      aria-label="Your trip"
    >
      <FontAwesomeIcon icon={faUser} className="h-4 w-4" aria-hidden="true" />
    </span>
  )
}
