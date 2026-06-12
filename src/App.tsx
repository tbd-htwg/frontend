import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/AdminRoute'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { TenantBrandingProvider } from './context/TenantBrandingContext'
import { AppAuthProvider } from './demo/DemoAuthProvider'
import { AdminTenantCreatePage } from './pages/admin/AdminTenantCreatePage'
import { AdminTenantDetailPage } from './pages/admin/AdminTenantDetailPage'
import { AdminTenantUsersPage } from './pages/admin/AdminTenantUsersPage'
import { AdminTenantsPage } from './pages/admin/AdminTenantsPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { TripDetailPage } from './pages/TripDetailPage'
import { ImpressumPage } from './pages/ImpressumPage'
import { TripEditRedirect } from './pages/TripEditRedirect'
import { TripNewRedirect } from './pages/TripNewRedirect'
import { TenantUsersPage } from './pages/TenantUsersPage'
import { UserProfilePage } from './pages/UserProfilePage'

export function App() {
  return (
    <AppAuthProvider>
      <TenantBrandingProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="impressum" element={<ImpressumPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="users" element={<TenantUsersPage />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="trips/new"
              element={
                <ProtectedRoute>
                  <TripNewRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="trips/:id/edit"
              element={
                <ProtectedRoute>
                  <TripEditRedirect />
                </ProtectedRoute>
              }
            />
            <Route path="users/:id" element={<UserProfilePage />} />
            <Route path="trips/:id" element={<TripDetailPage />} />
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <Navigate to="/admin/tenants" replace />
                </AdminRoute>
              }
            />
            <Route
              path="admin/tenants"
              element={
                <AdminRoute>
                  <AdminTenantsPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/tenants/new"
              element={
                <AdminRoute>
                  <AdminTenantCreatePage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/tenants/:id/users"
              element={
                <AdminRoute>
                  <AdminTenantUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/tenants/:id"
              element={
                <AdminRoute>
                  <AdminTenantDetailPage />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </TenantBrandingProvider>
    </AppAuthProvider>
  )
}
