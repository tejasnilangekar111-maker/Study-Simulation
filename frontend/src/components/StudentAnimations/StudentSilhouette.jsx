import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ACTIONS = ['writing', 'typing', 'stretching', 'looking']

function pickAction(exclude) {
  const options = ACTIONS.filter((a) => a !== exclude)
  return options[Math.floor(Math.random() * options.length)]
}

export default function StudentSilhouette({ left = '10%', bottom = '5%', scale = 1, color = '#3a2818' }) {
  const [action, setAction] = useState(() => pickAction())

  useEffect(() => {
    let timeoutId
    const schedule = () => {
      const delay = 4000 + Math.random() * 6000
      timeoutId = setTimeout(() => {
        setAction((prev) => pickAction(prev))
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <motion.div
      className="absolute pointer-events-none opacity-30"
      style={{ left, bottom, transformOrigin: 'bottom' }}
      animate={{ scale: [scale, scale * 1.015, scale] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="60" height="90" viewBox="0 0 60 90" fill={color}>
        {/* head */}
        <circle cx="30" cy="14" r="10" />
        {/* body */}
        <rect x="18" y="24" width="24" height="36" rx="8" />
        {/* desk */}
        <rect x="6" y="66" width="48" height="6" rx="2" opacity="0.8" />

        <AnimatePresence mode="wait">
          {action === 'writing' && (
            <motion.rect
              key="writing"
              x="38"
              y="46"
              width="14"
              height="4"
              rx="2"
              animate={{ x: [38, 44, 38] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {action === 'typing' && (
            <motion.g key="typing">
              {[0, 1, 2].map((i) => (
                <motion.rect
                  key={i}
                  x={20 + i * 8}
                  y="50"
                  width="6"
                  height="4"
                  rx="1"
                  animate={{ y: [50, 47, 50] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.g>
          )}
          {action === 'stretching' && (
            <motion.rect
              key="stretching"
              x="10"
              y="20"
              width="6"
              height="24"
              rx="3"
              animate={{ rotate: [0, -30, 0] }}
              style={{ transformOrigin: '30px 24px' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          )}
          {action === 'looking' && (
            <motion.circle
              key="looking"
              cx="30"
              cy="14"
              r="10"
              fill="none"
              stroke={color}
              strokeWidth="0"
              animate={{ rotate: [0, 20, -20, 0] }}
              style={{ transformOrigin: '30px 14px' }}
              transition={{ duration: 3, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  )
}
