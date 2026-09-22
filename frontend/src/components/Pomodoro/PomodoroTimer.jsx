import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FiPlay, FiPause, FiSkipForward, FiSettings } from 'react-icons/fi'
import { useSessionStore } from '../../store/sessionStore'
import { formatTime } from '../../utils/formatTime'
import { playOneShot } from '../SoundMixer/useHowlerSound'
import CircularProgress from './CircularProgress'

export default function PomodoroTimer() {
  const {
    mode,
    secondsLeft,
    isRunning,
    workMinutes,
    breakMinutes,
    start,
    pause,
    tick,
    skip,
    setDurations,
  } = useSessionStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const prevSecondsRef = useRef(secondsLeft)

  useEffect(() => {
    const interval = setInterval(() => {
      tick()
    }, 1000)
    return () => clearInterval(interval)
  }, [tick])

  // Study-minute/streak recording now happens incrementally inside
  // sessionStore.tick() as work time elapses (see sessionStore.js) — this
  // effect only handles the completion chime.
  useEffect(() => {
    if (secondsLeft > prevSecondsRef.current) {
      // A cycle just rolled over (secondsLeft jumped back up).
      playOneShot('/sounds/chime.mp3')
    }
    prevSecondsRef.current = secondsLeft
  }, [secondsLeft])

  const totalSeconds = (mode === 'work' ? workMinutes : breakMinutes) * 60
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0
  const isLow = secondsLeft / totalSeconds < 0.1

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-4 pointer-events-none">
      <motion.div
        animate={isLow ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={isLow ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
        className="glass rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 shadow-2xl pointer-events-auto"
      >
        <div className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] shrink-0">
          <CircularProgress
            progress={progress}
            color={mode === 'work' ? '#ff8066' : '#34d399'}
            size={220}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-bold tabular-nums">{formatTime(secondsLeft)}</span>
            <span className="text-xs uppercase tracking-[0.2em] text-offwhite/60 mt-1">{mode}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => (isRunning ? pause() : start())}
            className="bg-coral-500/90 hover:bg-coral-500 text-walnut-950 rounded-full p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite"
            aria-label={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? <FiPause size={22} /> : <FiPlay size={22} />}
          </button>
          <button
            onClick={skip}
            className="bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            aria-label="Skip"
          >
            <FiSkipForward size={18} />
          </button>
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            className="bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            aria-label="Timer settings"
            aria-expanded={settingsOpen}
          >
            <FiSettings size={18} />
          </button>
        </div>
      </motion.div>

      {settingsOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-3 w-56 text-sm pointer-events-auto"
        >
          <label className="flex items-center justify-between mb-2">
            <span>Work (min)</span>
            <input
              type="number"
              min={1}
              max={120}
              value={workMinutes}
              onChange={(e) => setDurations(Number(e.target.value) || 1, breakMinutes)}
              className="w-16 bg-white/10 rounded px-2 py-1 text-right"
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Break (min)</span>
            <input
              type="number"
              min={1}
              max={60}
              value={breakMinutes}
              onChange={(e) => setDurations(workMinutes, Number(e.target.value) || 1)}
              className="w-16 bg-white/10 rounded px-2 py-1 text-right"
            />
          </label>
        </motion.div>
      )}
    </div>
  )
}
