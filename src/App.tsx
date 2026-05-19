import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { TripDetailPage } from './pages/TripDetailPage'
import { ImpressumPage } from './pages/ImpressumPage'
import { TripEditRedirect } from './pages/TripEditRedirect'
import { TripNewRedirect } from './pages/TripNewRedirect'
import { UserProfilePage } from './pages/UserProfilePage'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="impressum" element={<ImpressumPage />} />
            <Route path="login" element={<LoginPage />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
