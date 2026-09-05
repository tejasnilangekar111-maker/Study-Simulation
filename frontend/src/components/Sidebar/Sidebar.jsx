import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight, FiCheckSquare, FiBarChart2, FiZap } from 'react-icons/fi'
import { useUiStore } from '../../store/uiStore'
import { useSidebarStore } from '../../store/sidebarStore'
import QuickNotes from './QuickNotes'
import StudyStreak from './StudyStreak'

export default function Sidebar() {
  const focusMode = useUiStore((s) => s.focusMode)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const todos = useSidebarStore((s) => s.todos)
  const streak = useSidebarStore((s) => s.streak)

  const doneToday = todos.filter((t) => t.done).length
  const pending = todos.length - doneToday

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
      isActive ? 'bg-accent-blue/20 text-accent-blue' : 'text-offwhite/70 hover:bg-white/10 hover:text-offwhite'
    }`

  return (
    <AnimatePresence>
      {!focusMode && (
        <motion.aside
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0, width: collapsed ? 56 : 260 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed left-0 top-0 bottom-0 z-20 glass border-r border-white/10 overflow-hidden flex flex-col"
        >
          <button
            onClick={toggleSidebar}
            className="self-end m-2 text-offwhite/60 hover:text-offwhite p-1"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
          </button>

          {collapsed ? (
            <div className="flex flex-col items-center gap-5 mt-2 text-offwhite/60">
              <NavLink to="/todo" className="hover:text-accent-blue" aria-label="To-do">
                <FiCheckSquare size={18} />
              </NavLink>
              <NavLink to="/analytics" className="hover:text-accent-blue" aria-label="Analytics">
                <FiBarChart2 size={18} />
              </NavLink>
              <div className="flex flex-col items-center gap-0.5 text-coral-500" title="Study streak">
                <FiZap size={16} />
                <span className="text-[10px]">{streak.count}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
              <nav className="space-y-1 pt-1">
                <NavLink to="/todo" className={linkClass}>
                  <FiCheckSquare size={16} />
                  <span className="flex-1">To-Do &amp; Goals</span>
                  {pending > 0 && (
                    <span className="text-[10px] bg-white/15 rounded-full px-1.5 py-0.5">{pending}</span>
                  )}
                </NavLink>
                <NavLink to="/analytics" className={linkClass}>
                  <FiBarChart2 size={16} />
                  <span className="flex-1">Analytics</span>
                </NavLink>
              </nav>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-2">
                  Quick Preview
                </h4>
                <p className="text-sm text-offwhite/70 mb-2">
                  {doneToday}/{todos.length || 0} tasks done today
                </p>
                <ul className="space-y-1 max-h-28 overflow-y-auto">
                  {todos.slice(0, 4).map((t) => (
                    <li key={t.id} className={`text-xs truncate ${t.done ? 'line-through text-offwhite/40' : 'text-offwhite/80'}`}>
                      • {t.text}
                    </li>
                  ))}
                  {todos.length === 0 && <li className="text-xs text-offwhite/40">No tasks yet.</li>}
                </ul>
              </div>

              <QuickNotes />
              <StudyStreak />
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
