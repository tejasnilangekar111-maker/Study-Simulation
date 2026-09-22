import { useMemo } from 'react'
import { motion } from 'framer-motion'
import RainLayer from './RainLayer'
import AmbientGlow from './AmbientGlow'

// Fixed low-opacity glow colors — not tied to the theme variables — so they
// read as a gentle wash in both dark and light mode by construction, instead
// of relying on a photograph's exposure to happen to work in both.
const GLOW_COLORS = [
  'rgba(232,121,201,0.16)',
  'rgba(155,123,255,0.18)',
  'rgba(255,179,122,0.14)',
  'rgba(127,179,224,0.14)',
]

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

// No photography — a soft, animated glow plus rain and drifting bokeh lights
// carry the ambience. Fully CSS-driven, so it's guaranteed to read correctly
// in both themes instead of fighting a photo's fixed exposure.
export default function LofiScene({ children }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-lofi-950">
      <AmbientGlow colors={GLOW_COLORS} />

      <RainLayer intensity={0.4} />
      <BokehLights />

      {children}
    </div>
  )
}
