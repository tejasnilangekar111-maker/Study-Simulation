import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { useAuthStore } from './store/authStore'

const StudyRoomPage = lazy(() => import('./pages/StudyRoomPage'))
const TodoPage = lazy(() => import('./pages/TodoPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

const PageLoader = ({ label }) => (
  <div className="min-h-screen flex items-center justify-center bg-walnut-950 text-offwhite/60">{label}</div>
)

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/study"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader label="Loading study room…" />}>
              <StudyRoomPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/todo"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader label="Loading to-do list…" />}>
              <TodoPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader label="Loading analytics…" />}>
              <AnalyticsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
