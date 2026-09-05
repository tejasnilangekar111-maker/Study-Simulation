import { useSidebarStore } from '../../store/sidebarStore'

export default function WeeklyAnalytics() {
  const getWeeklyChartData = useSidebarStore((s) => s.getWeeklyChartData)
  const data = getWeeklyChartData()
  const max = Math.max(60, ...data.map((d) => d.minutes))

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-2">Weekly Analytics</h4>
      <div className="flex items-end justify-between gap-1.5 h-24 bg-white/5 rounded-lg p-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-accent-blue to-emerald-500 transition-all duration-500"
                style={{ height: `${Math.max(4, (d.minutes / max) * 100)}%` }}
                title={`${d.minutes} min`}
              />
            </div>
            <span className="text-[9px] text-offwhite/50">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
