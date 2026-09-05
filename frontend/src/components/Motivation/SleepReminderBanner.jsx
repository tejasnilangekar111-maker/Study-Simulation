import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMoon, FiX } from 'react-icons/fi'
import { localDateKey } from '../../utils/formatTime'

// "Night" window during which the reminder can show: midnight up to (not
// including) this hour. Recorded per-night so dismissing it doesn't
// suppress it again tomorrow.
const NIGHT_END_HOUR = 5
const DISMISS_KEY_PREFIX = 'sleep-reminder-dismissed-'

function isLateNight(date) {
  return date.getHours() < NIGHT_END_HOUR
}

export default function SleepReminderBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const check = () => {
      const now = new Date()
      if (!isLateNight(now)) {
        setVisible(false)
        return
      }
      const nightKey = DISMISS_KEY_PREFIX + localDateKey(now)
      setVisible(localStorage.getItem(nightKey) !== 'true')
    }

    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY_PREFIX + localDateKey(new Date()), 'true')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-md sm:top-6"
        >
          <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <FiMoon className="text-accent-blue shrink-0" size={20} />
            <p className="text-sm text-offwhite/85 flex-1">
              It's past midnight — consider wrapping up soon and getting some rest.
            </p>
            <button
              onClick={dismiss}
              className="text-offwhite/50 hover:text-offwhite shrink-0"
              aria-label="Dismiss"
            >
              <FiX size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
