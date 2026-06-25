import { Link, NavLink, Outlet } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faHouse,
  faRightFromBracket,
  faRightToBracket,
  faUser,
  faUsers,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import { useAppAuth, useIsPlatformAdmin } from '../demo/DemoAuthProvider'
import { DemoBanner } from '../demo/DemoBanner'
import { ProfileModalProvider } from '../context/ProfileModalContext'
import { TripModalProvider, useTripModal } from '../context/TripModalContext'
import { AppBrand } from './AppBrand'
import { TenantNotReadyGate } from './TenantNotReadyGate'
import { ProfileFormModal } from './profile/ProfileFormModal'
import { TripFormModal } from './trip/TripFormModal'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100',
  ].join(' ')

export function Layout() {
  return (
    <TripModalProvider>
      <ProfileModalProvider>
        <LayoutShell />
      </ProfileModalProvider>
    </TripModalProvider>
  )
}

function LayoutShell() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <AppBrand />
            <DemoBanner />
          </div>
          <LayoutNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <TenantNotReadyGate>
          <Outlet />
        </TenantNotReadyGate>
      </main>
      <TripFormModal />
      <ProfileFormModal />

      <footer className="border-t border-slate-300 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Link
              to="/impressum"
              aria-label="Open contact and legal information"
              className="text-slate-600 transition-colors hover:text-slate-900 hover:underline"
            >
              Contact
            </Link>
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Impressum with team list, e-mail addresses, and matriculation numbers.
          </p>
        </div>
      </footer>
    </div>
  )
}

function LayoutNav() {
  const { user, logout } = useAppAuth()
  const isAdmin = useIsPlatformAdmin()
  const { openCreateTrip } = useTripModal()

  return (
    <nav className="flex flex-wrap items-center gap-2">
      <NavLink to="/" className={navLinkClass} end aria-label="Home">
        <span className="inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faHouse} aria-hidden="true" />
          Home
        </span>
      </NavLink>
      <NavLink to="/users/" className={navLinkClass} aria-label="Community users">
        <span className="inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faUsers} aria-hidden="true" />
          Users
        </span>
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin/tenants" className={navLinkClass} aria-label="Admin">
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
            Admin
          </span>
        </NavLink>
      )}
      {user ? (
        <>
          <NavLink to="/profile" className={navLinkClass} aria-label="Profile">
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              Profile
            </span>
          </NavLink>
          <button
            type="button"
            onClick={() => openCreateTrip()}
            className={navLinkClass({ isActive: false })}
            aria-label="Create new trip"
          >
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
              New trip
            </span>
          </button>
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Log out"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
              Log out
            </span>
          </button>
        </>
      ) : (
        <NavLink to="/login" className={navLinkClass} aria-label="Log in">
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
            Log in
          </span>
        </NavLink>
      )}
    </nav>
  )
}
