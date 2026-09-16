import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight, FiCheckSquare, FiBarChart2, FiZap, FiMenu, FiX } from 'react-icons/fi'
import { useUiStore } from '../../store/uiStore'
import { useSidebarStore } from '../../store/sidebarStore'
import QuickNotes from './QuickNotes'
import StudyStreak from './StudyStreak'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue'

export default function Sidebar() {
  const focusMode = useUiStore((s) => s.focusMode)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const mobileOpen = useUiStore((s) => s.sidebarMobileOpen)
  const toggleSidebarMobile = useUiStore((s) => s.toggleSidebarMobile)
  const closeSidebarMobile = useUiStore((s) => s.closeSidebarMobile)
  const todos = useSidebarStore((s) => s.todos)
  const streak = useSidebarStore((s) => s.streak)

  const doneToday = todos.filter((t) => t.done).length
  const pending = todos.length - doneToday

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${FOCUS_RING} ${
      isActive ? 'bg-accent-blue/20 text-accent-blue' : 'text-offwhite/70 hover:bg-white/10 hover:text-offwhite'
    }`

  // "collapsed" only ever applies on desktop (md+) — on mobile the sidebar is
  // an off-canvas drawer that's either fully open or fully hidden, so it's
  // always shown at full width while open.
  const widthClass = collapsed ? 'w-64 md:w-14' : 'w-64 md:w-64'
  const transformClass = focusMode
    ? '-translate-x-full md:-translate-x-full'
    : mobileOpen
      ? 'translate-x-0 md:translate-x-0'
      : '-translate-x-full md:translate-x-0'
  const railClass = collapsed
    ? 'hidden md:flex flex-col items-center gap-5 mt-2 text-offwhite/60'
    : 'hidden'
  const contentClass = collapsed
    ? 'flex-1 overflow-y-auto px-4 pb-6 space-y-6 block md:hidden'
    : 'flex-1 overflow-y-auto px-4 pb-6 space-y-6 block'

  return (
    <>
      {/* Mobile hamburger trigger — hidden once the drawer is open or in focus mode */}
      <AnimatePresence>
        {!mobileOpen && !focusMode && (
          <motion.button
            key="sidebar-trigger"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={toggleSidebarMobile}
            className={`fixed top-4 left-4 z-30 md:hidden glass rounded-full p-2.5 text-offwhite/80 hover:text-offwhite shadow-xl ${FOCUS_RING}`}
            aria-label="Open menu"
          >
            <FiMenu size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && !focusMode && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebarMobile}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 glass border-r border-white/10 overflow-hidden flex flex-col transition-[transform,width] duration-300 ease-out ${widthClass} ${transformClass}`}
      >
        <div className="flex items-center justify-between m-2">
          <button
            onClick={closeSidebarMobile}
            className={`md:hidden text-offwhite/60 hover:text-offwhite p-1 rounded ${FOCUS_RING}`}
            aria-label="Close menu"
          >
            <FiX size={18} />
          </button>
          <button
            onClick={toggleSidebar}
            className={`hidden md:inline-flex ml-auto text-offwhite/60 hover:text-offwhite p-1 rounded ${FOCUS_RING}`}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
          </button>
        </div>

        <div className={railClass}>
          <NavLink to="/todo" className={`hover:text-accent-blue rounded ${FOCUS_RING}`} aria-label="To-do">
            <FiCheckSquare size={18} />
          </NavLink>
          <NavLink to="/analytics" className={`hover:text-accent-blue rounded ${FOCUS_RING}`} aria-label="Analytics">
            <FiBarChart2 size={18} />
          </NavLink>
          <div className="flex flex-col items-center gap-0.5 text-coral-500" title="Study streak">
            <FiZap size={16} />
            <span className="text-[10px]">{streak.count}</span>
          </div>
        </div>

        <div className={contentClass}>
          <nav className="space-y-1 pt-1">
            <NavLink to="/todo" className={linkClass} onClick={closeSidebarMobile}>
              <FiCheckSquare size={16} />
              <span className="flex-1">To-Do &amp; Goals</span>
              {pending > 0 && (
                <span className="text-[10px] bg-white/15 rounded-full px-1.5 py-0.5">{pending}</span>
              )}
            </NavLink>
            <NavLink to="/analytics" className={linkClass} onClick={closeSidebarMobile}>
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
                <li key={t.id} className={`text-xs truncate ${t.done ? 'line-through text-offwhite/55' : 'text-offwhite/80'}`}>
                  • {t.text}
                </li>
              ))}
              {todos.length === 0 && <li className="text-xs text-offwhite/55">No tasks yet.</li>}
            </ul>
          </div>

          <QuickNotes />
          <StudyStreak />
        </div>
      </aside>
    </>
  )
}
