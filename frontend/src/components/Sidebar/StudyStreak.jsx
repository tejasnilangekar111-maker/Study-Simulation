import { FiZap } from 'react-icons/fi'
import { useSidebarStore } from '../../store/sidebarStore'

export default function StudyStreak() {
  const streak = useSidebarStore((s) => s.streak)

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-2">Study Streak</h4>
      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
        <FiZap className="text-coral-500" size={18} />
        <span className="text-lg font-bold">{streak.count}</span>
        <span className="text-xs text-offwhite/60">day{streak.count === 1 ? '' : 's'} in a row</span>
      </div>
    </div>
  )
}
