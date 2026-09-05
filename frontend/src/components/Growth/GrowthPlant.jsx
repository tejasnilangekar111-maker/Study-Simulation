import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '../../store/sessionStore'
import { useSidebarStore } from '../../store/sidebarStore'
import { localDateKey } from '../../utils/formatTime'

// A small desk plant that grows leaf-by-leaf as the current work session
// progresses, blooms on completion, and resets to a seedling on the next
// work block — a lightweight, always-visible sense of forward motion.
// If the study streak breaks (a day was missed), growth freezes and the
// plant wilts until a new streak starts, mirroring Forest-style stakes.
export default function GrowthPlant() {
  const mode = useSessionStore((s) => s.mode)
  const secondsLeft = useSessionStore((s) => s.secondsLeft)
  const workMinutes = useSessionStore((s) => s.workMinutes)
  const justCompleted = useSessionStore((s) => s.justCompleted)
  const streak = useSidebarStore((s) => s.streak)
  const [bloom, setBloom] = useState(false)

  const today = localDateKey()
  const yesterday = localDateKey(new Date(Date.now() - 86400000))
  // A gap of 2+ days since the last active day means the streak has died —
  // "today" or "yesterday" (still pending today's session) both count as alive.
  const streakBroken =
    !!streak.lastActiveDate && streak.lastActiveDate !== today && streak.lastActiveDate !== yesterday

  const totalSeconds = workMinutes * 60
  const rawProgress = mode === 'work' && totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : mode === 'break' ? 1 : 0
  const progress = streakBroken ? 0 : rawProgress

  useEffect(() => {
    if (!streakBroken && justCompleted && mode === 'break') {
      setBloom(true)
      const timeout = setTimeout(() => setBloom(false), 3200)
      return () => clearTimeout(timeout)
    }
  }, [justCompleted, mode, streakBroken])

  const stemHeight = 6 + progress * 46
  const leafCount = Math.min(3, Math.floor(progress * 3.2))
  const leafColor = streakBroken ? '#8a7a5c' : undefined

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 sm:bottom-6 pointer-events-none">
      <div className="glass rounded-2xl px-4 py-3 flex flex-col items-center gap-1 shadow-2xl w-[76px]">
        <svg width="48" height="64" viewBox="0 0 48 64" className="overflow-visible">
          {/* pot */}
          <path d="M14 54 L34 54 L31 62 L17 62 Z" fill="#4a3320" />
          <rect x="12" y="48" width="24" height="8" rx="2" fill="#3a2818" />

          {/* stem — droops when the streak has broken */}
          <motion.line
            x1="24"
            y1="54"
            animate={{ y2: 54 - stemHeight, x2: streakBroken ? 30 : 24 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            stroke={streakBroken ? '#6b5d42' : '#34d399'}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* leaves, appear progressively */}
          <AnimatePresence>
            {leafCount >= 1 && (
              <motion.path
                key="leaf-1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ transformOrigin: '20px 38px' }}
                d="M24 38 C14 34, 10 42, 20 44 C24 44, 24 40, 24 38 Z"
                fill={leafColor || '#34d399'}
              />
            )}
            {leafCount >= 2 && (
              <motion.path
                key="leaf-2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ transformOrigin: '28px 26px' }}
                d="M24 26 C34 22, 38 30, 28 32 C24 32, 24 28, 24 26 Z"
                fill={leafColor || '#4fd8a8'}
              />
            )}
            {leafCount >= 3 && (
              <motion.path
                key="leaf-3"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ transformOrigin: '20px 16px' }}
                d="M24 16 C14 12, 10 20, 20 22 C24 22, 24 18, 24 16 Z"
                fill={leafColor || '#34d399'}
              />
            )}
          </AnimatePresence>

          {/* bloom flower on completion */}
          <AnimatePresence>
            {!streakBroken && bloom && (
              <motion.g
                key="flower"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: [0, 1.2, 1] }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ transformOrigin: `24px ${54 - stemHeight}px` }}
              >
                {[0, 72, 144, 216, 288].map((angle) => (
                  <ellipse
                    key={angle}
                    cx="24"
                    cy={54 - stemHeight - 6}
                    rx="4"
                    ry="7"
                    fill="#ff8066"
                    transform={`rotate(${angle} 24 ${54 - stemHeight})`}
                  />
                ))}
                <circle cx="24" cy={54 - stemHeight} r="3.5" fill="#ffe0a3" />
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
        <span className={`text-[10px] uppercase tracking-wide ${streakBroken ? 'text-coral-500/80' : 'text-offwhite/50'}`}>
          {streakBroken ? 'Streak broken' : bloom ? 'Bloomed!' : mode === 'work' ? 'Growing…' : 'Resting'}
        </span>
      </div>
    </div>
  )
}
