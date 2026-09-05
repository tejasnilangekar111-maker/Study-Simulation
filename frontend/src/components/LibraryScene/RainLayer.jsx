import { motion } from 'framer-motion'
import { useMemo } from 'react'

export default function RainLayer({ intensity = 1 }) {
  const drops = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.8 + Math.random() * 0.6,
        height: 40 + Math.random() * 60,
      })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.35 * intensity }}>
      {drops.map((d) => (
        <motion.span
          key={d.id}
          className="absolute w-px bg-gradient-to-b from-transparent via-accent-blue/60 to-transparent"
          style={{ left: `${d.left}%`, height: d.height }}
          initial={{ y: '-10%' }}
          animate={{ y: '110vh' }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}
