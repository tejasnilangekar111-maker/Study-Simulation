import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RainLayer from './RainLayer'

const BACKGROUNDS = [
  '/backgrounds/study-1.jpg',
  '/backgrounds/study-2.jpg',
  '/backgrounds/study-3.jpg',
  '/backgrounds/study-4.jpg',
]

const ROTATE_MS = 45000

function BokehLights() {
  const lights = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: 10 + Math.random() * 60,
        size: 6 + Math.random() * 16,
        color: [
          'rgba(232,121,201,0.3)',
          'rgba(155,123,255,0.3)',
          'rgba(255,179,122,0.28)',
        ][i % 3],
        duration: 6 + Math.random() * 6,
      })),
    []
  )
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {lights.map((l) => (
        <motion.div
          key={l.id}
          className="absolute rounded-full blur-md"
          style={{ left: `${l.left}%`, top: `${l.top}%`, width: l.size, height: l.size, background: l.color }}
          animate={{ y: [0, -18, 0], opacity: [0.25, 0.7, 0.25] }}
          transition={{ duration: l.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function LofiScene({ children }) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * BACKGROUNDS.length))

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % BACKGROUNDS.length)
    }, ROTATE_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-lofi-950">
      <AnimatePresence mode="sync">
        <motion.div
          key={BACKGROUNDS[index]}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        >
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${BACKGROUNDS[index]})` }}
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: ROTATE_MS / 1000, ease: 'linear' }}
          />
        </motion.div>
      </AnimatePresence>

      <RainLayer intensity={0.4} />
      <BokehLights />

      {/* darken + vignette so foreground UI (timer, sidebar, plant) stays legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-lofi-950/30 via-lofi-950/35 to-lofi-950/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-lofi-950/50 via-transparent to-lofi-950/30" />

      {children}
    </div>
  )
}
