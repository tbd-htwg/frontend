import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import type { TenantUser } from '../../types/tenant'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

type TenantUserRowProps = {
  user: TenantUser
  showEmail?: boolean
  showDelete?: boolean
  onDelete?: (userId: number) => void
}

export function TenantUserRow({
  user,
  showEmail = false,
  showDelete = false,
  onDelete,
}: TenantUserRowProps) {
  return (
    <li className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700"
        aria-hidden
      >
        {initials(user.name)}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          to={`/users/${user.id}`}
          className="font-medium text-slate-900 hover:underline"
        >
          {user.name}
        </Link>
        {showEmail && (
          <p className="truncate text-sm text-slate-500">{user.email}</p>
        )}
        {user.description && (
          <p className="truncate text-sm text-slate-600">{user.description}</p>
        )}
      </div>
      {showDelete && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(user.id)}
          className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete user ${user.name}`}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
    </li>
  )
}
