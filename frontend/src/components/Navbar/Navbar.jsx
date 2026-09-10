import { AnimatePresence, motion } from 'framer-motion'
import { FiBookOpen, FiCheckSquare, FiBarChart2 } from 'react-icons/fi'
import { NavLink } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'

const NAV_LINKS = [
  { to: '/study', label: 'Study', icon: FiBookOpen },
  { to: '/todo', label: 'To-Do', icon: FiCheckSquare },
  { to: '/analytics', label: 'Analytics', icon: FiBarChart2 },
]

export default function Navbar() {
  const focusMode = useUiStore((s) => s.focusMode)

  return (
    <AnimatePresence>
      {!focusMode && (
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed top-0 right-0 z-20 flex items-center gap-3 p-4"
        >
          <div className="glass rounded-full flex items-center gap-1 p-1 mr-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive ? 'bg-accent-blue/25 text-accent-blue' : 'text-offwhite/70 hover:text-offwhite hover:bg-white/10'
                  }`
                }
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
