import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import { useAuthStore } from './store/authStore'
import api from './services/api'

const StudyRoomPage = lazy(() => import('./pages/StudyRoomPage'))
const TodoPage = lazy(() => import('./pages/TodoPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))

const PageLoader = ({ label }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-walnut-950 text-offwhite/70">
    <div className="glass rounded-2xl p-5 flex items-center gap-3 shadow-2xl">
      <span className="w-5 h-5 rounded-full border-2 border-offwhite/25 border-t-accent-blue animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  </div>
)

// Fades each route in/out so navigating between the warm landing-page theme
// and the cooler in-app "lofi" theme reads as a transition, not a hard cut.
const PageFade = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.35, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
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

  const location = useLocation()

  if (!ready) return <PageLoader label="Loading…" />

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageFade><LandingPage /></PageFade>} />
        <Route
          path="/study"
          element={
            <PageFade>
              <Suspense fallback={<PageLoader label="Loading study room…" />}>
                <StudyRoomPage />
              </Suspense>
            </PageFade>
          }
        />
        <Route
          path="/todo"
          element={
            <PageFade>
              <Suspense fallback={<PageLoader label="Loading to-do list…" />}>
                <TodoPage />
              </Suspense>
            </PageFade>
          }
        />
        <Route
          path="/analytics"
          element={
            <PageFade>
              <Suspense fallback={<PageLoader label="Loading analytics…" />}>
                <AnalyticsPage />
              </Suspense>
            </PageFade>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
