import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import { useAuthStore } from './store/authStore'
import api from './services/api'

const StudyRoomPage = lazy(() => import('./pages/StudyRoomPage'))
const TodoPage = lazy(() => import('./pages/TodoPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))

const PageLoader = ({ label }) => (
  <div className="min-h-screen flex items-center justify-center bg-walnut-950 text-offwhite/60">{label}</div>
)

export default function App() {
  const token = useAuthStore((s) => s.token)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [ready, setReady] = useState(!!token)

  useEffect(() => {
    if (token) {
      setReady(true)
      return
    }
    api
      .post('/auth/guest')
      .then(({ data }) => setAuth({ username: data.username }, data.token))
      .finally(() => setReady(true))
  }, [token, setAuth])

  if (!ready) return <PageLoader label="Loading…" />

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/study"
        element={
          <Suspense fallback={<PageLoader label="Loading study room…" />}>
            <StudyRoomPage />
          </Suspense>
        }
      />
      <Route
        path="/todo"
        element={
          <Suspense fallback={<PageLoader label="Loading to-do list…" />}>
            <TodoPage />
          </Suspense>
        }
      />
      <Route
        path="/analytics"
        element={
          <Suspense fallback={<PageLoader label="Loading analytics…" />}>
            <AnalyticsPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
