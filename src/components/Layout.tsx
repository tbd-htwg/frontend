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
import { ColorSchemeToggle } from './ColorSchemeToggle'
import { useBrandingOverrideActive } from '../context/TenantBrandingContext'
import { TenantNotReadyGate } from './TenantNotReadyGate'
import { ProfileFormModal } from './profile/ProfileFormModal'
import { TripFormModal } from './trip/TripFormModal'

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
  const brandingPreviewActive = useBrandingOverrideActive()

  return (
    <div className="tenant-layout flex min-h-screen flex-col">
      <header className="tenant-chrome border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <AppBrand />
            {brandingPreviewActive && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                Preview
              </span>
            )}
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

      <footer className="tenant-chrome border-t">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-8">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-80">
              <Link
                to="/impressum"
                aria-label="Open contact and legal information"
                className="transition-opacity hover:opacity-100 hover:underline"
              >
                Contact
              </Link>
            </h2>
            <p className="mt-2 text-sm opacity-90">
              Impressum with team list, e-mail addresses, and matriculation numbers.
            </p>
          </div>
          <ColorSchemeToggle />
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
      <NavLink to="/" className="tenant-nav-link" end aria-label="Home">
        <span className="inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faHouse} aria-hidden="true" />
          Home
        </span>
      </NavLink>
      <NavLink to="/users/" className="tenant-nav-link" aria-label="Community users">
        <span className="inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faUsers} aria-hidden="true" />
          Users
        </span>
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin/tenants" className="tenant-nav-link" aria-label="Admin">
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
            Admin
          </span>
        </NavLink>
      )}
      {user ? (
        <>
          <NavLink to="/profile" className="tenant-nav-link" aria-label="Profile">
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              Profile
            </span>
          </NavLink>
          <button
            type="button"
            onClick={() => openCreateTrip()}
            className="tenant-nav-link"
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
            className="tenant-nav-link"
          >
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
              Log out
            </span>
          </button>
        </>
      ) : (
        <NavLink to="/login" className="tenant-nav-link" aria-label="Log in">
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
            Log in
          </span>
        </NavLink>
      )}
    </nav>
  )
}
