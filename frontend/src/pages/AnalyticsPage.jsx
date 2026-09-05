import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiClock, FiCheckCircle, FiZap, FiAward } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useSidebarStore } from '../store/sidebarStore'
import Navbar from '../components/Navbar/Navbar'
import Sidebar from '../components/Sidebar/Sidebar'
import LofiScene from '../components/LibraryScene/LofiScene'
import SleepReminderBanner from '../components/Motivation/SleepReminderBanner'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 flex items-center gap-3"
    >
      <div className="rounded-full p-2.5" style={{ backgroundColor: `${color}22`, color }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-offwhite/50">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </motion.div>
  )
}

function WeeklyChart({ data }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(60, ...data.map((d) => d.minutes))

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-offwhite/90 mb-4">This Week</h3>
      <div className="flex items-end justify-between gap-3 h-52">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-2 h-full justify-end relative"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <AnimatePresence>
              {hovered === i && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute -top-1 glass rounded-md px-2 py-1 text-[10px] whitespace-nowrap z-10"
                  style={{ bottom: `${Math.max(4, (d.minutes / max) * 100)}%` }}
                >
                  {d.minutes} min
                </motion.div>
              )}
            </AnimatePresence>
            <div className="w-full flex-1 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(4, (d.minutes / max) * 100)}%` }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                className={`w-full rounded-t-md bg-gradient-to-t from-accent-blue to-emerald-500 ${
                  hovered === i ? 'brightness-110' : ''
                }`}
              />
            </div>
            <span className="text-xs text-offwhite/50">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeatmapStrip({ data }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.minutes))

  const colorFor = (minutes) => {
    if (minutes === 0) return 'rgba(255,255,255,0.06)'
    const t = Math.min(1, minutes / max)
    // interpolate walnut -> emerald
    const r = Math.round(52 + (0 - 52) * t)
    const g = Math.round(211 * t + 40 * (1 - t))
    const b = Math.round(153 * t + 40 * (1 - t))
    return `rgba(${r},${g},${b},${0.35 + t * 0.65})`
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-offwhite/90 mb-4">Last 28 Days</h3>
      <div className="grid grid-cols-7 gap-1.5 relative">
        {data.map((d, i) => (
          <div key={d.date} className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.01 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="aspect-square rounded-md cursor-default"
              style={{ backgroundColor: colorFor(d.minutes) }}
            />
            <AnimatePresence>
              {hovered === i && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 glass rounded-md px-2 py-1 text-[10px] whitespace-nowrap z-10"
                >
                  {d.date}: {d.minutes} min
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const getWeeklyChartData = useSidebarStore((s) => s.getWeeklyChartData)
  const getHeatmapData = useSidebarStore((s) => s.getHeatmapData)
  const getTotals = useSidebarStore((s) => s.getTotals)
  const streak = useSidebarStore((s) => s.streak)

  const weekly = getWeeklyChartData()
  const heatmap = getHeatmapData(28)
  const { totalMinutes, totalSessions } = getTotals()

  return (
    <div className="relative min-h-screen w-full bg-lofi-950 text-offwhite">
      <LofiScene />
      <Navbar />
      <Sidebar />
      <SleepReminderBanner />

      <div className="relative z-10 pl-0 md:pl-[280px] px-6 py-24 max-w-5xl mx-auto transition-all">
        <button
          onClick={() => navigate('/study')}
          className="flex items-center gap-2 text-sm text-offwhite/60 hover:text-offwhite mb-6"
        >
          <FiArrowLeft size={14} /> Back to study room
        </button>

        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Analytics</h1>
        <p className="text-offwhite/60 mb-8">Your focus history, streaks, and weekly rhythm.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FiClock} label="Total Focus Time" value={`${Math.round(totalMinutes)}m`} color="#7fb3e0" />
          <StatCard icon={FiCheckCircle} label="Sessions Completed" value={totalSessions} color="#34d399" />
          <StatCard icon={FiZap} label="Current Streak" value={`${streak.count}d`} color="#ff8066" />
          <StatCard icon={FiAward} label="Best Streak" value={`${streak.best || streak.count}d`} color="#f5efe6" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <WeeklyChart data={weekly} />
          <HeatmapStrip data={heatmap} />
        </div>
      </div>
    </div>
  )
}
