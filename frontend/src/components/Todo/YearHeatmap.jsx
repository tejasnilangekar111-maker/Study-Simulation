import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebarStore } from '../../store/sidebarStore'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function colorFor(count, max) {
  if (count === 0) return 'rgba(255,255,255,0.06)'
  const t = Math.min(1, count / max)
  // interpolate from soft blue (light activity) to emerald (heavy activity)
  const r = Math.round(127 + (52 - 127) * t)
  const g = Math.round(179 + (211 - 179) * t)
  const b = Math.round(224 + (153 - 224) * t)
  return `rgba(${r},${g},${b},${0.3 + t * 0.7})`
}

export default function YearHeatmap() {
  const getTodoYearHeatmap = useSidebarStore((s) => s.getTodoYearHeatmap)
  const todos = useSidebarStore((s) => s.todos)
  const [hovered, setHovered] = useState(null)

  const days = useMemo(() => getTodoYearHeatmap(365), [getTodoYearHeatmap, todos])

  const { weeks, monthMarkers, max, totalCompleted } = useMemo(() => {
    // Pad the front so the first column starts on the right weekday (0 = Sunday).
    const firstDow = new Date(days[0]?.date).getDay()
    const padded = [...Array(firstDow).fill(null), ...days]

    const weeksArr = []
    for (let i = 0; i < padded.length; i += 7) {
      weeksArr.push(padded.slice(i, i + 7))
    }

    const markers = []
    let lastMonth = -1
    weeksArr.forEach((week, wi) => {
      const firstReal = week.find((d) => d)
      if (!firstReal) return
      const month = new Date(firstReal.date).getMonth()
      if (month !== lastMonth) {
        markers.push({ week: wi, label: MONTH_LABELS[month] })
        lastMonth = month
      }
    })

    const maxCount = Math.max(1, ...days.map((d) => d.count))
    const total = days.reduce((acc, d) => acc + d.count, 0)

    return { weeks: weeksArr, monthMarkers: markers, max: maxCount, totalCompleted: total }
  }, [days])

  return (
    <div className="glass rounded-2xl p-7">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-offwhite/90">Yearly Activity</h3>
        <span className="text-xs text-offwhite/55">{totalCompleted} tasks completed this year</span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          <div
            className="grid text-[10px] text-offwhite/50 mb-1"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(11px, 1fr))` }}
          >
            {weeks.map((_, wi) => {
              const marker = monthMarkers.find((m) => m.week === wi)
              return (
                <span key={wi} className="whitespace-nowrap">
                  {marker ? marker.label : ''}
                </span>
              )
            })}
          </div>

          <div
            className="grid grid-flow-col gap-[3px]"
            style={{ gridTemplateRows: 'repeat(7, minmax(11px, 1fr))', gridAutoColumns: 'minmax(11px, 1fr)' }}
          >
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const cellKey = `${wi}-${di}`
                if (!day) return <div key={cellKey} className="aspect-square" />
                return (
                  <div key={cellKey} className="relative">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: Math.min(wi * 0.006, 0.4) }}
                      onMouseEnter={() => setHovered(cellKey)}
                      onMouseLeave={() => setHovered(null)}
                      className="aspect-square rounded-[3px] cursor-default"
                      style={{ backgroundColor: colorFor(day.count, max) }}
                    />
                    <AnimatePresence>
                      {hovered === cellKey && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 glass rounded-md px-2 py-1 text-[10px] whitespace-nowrap z-20"
                        >
                          {day.count} {day.count === 1 ? 'task' : 'tasks'} · {day.date}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-offwhite/50">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: colorFor(step === 0 ? 0 : step, 4) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
