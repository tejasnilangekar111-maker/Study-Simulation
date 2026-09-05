import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiSettings, FiUser, FiX, FiLogOut, FiBookOpen, FiCheckSquare, FiBarChart2 } from 'react-icons/fi'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUiStore } from '../../store/uiStore'

const NAV_LINKS = [
  { to: '/study', label: 'Study', icon: FiBookOpen },
  { to: '/todo', label: 'To-Do', icon: FiCheckSquare },
  { to: '/analytics', label: 'Analytics', icon: FiBarChart2 },
]

export default function Navbar() {
  const focusMode = useUiStore((s) => s.focusMode)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
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
            <button
              onClick={() => setSettingsOpen(true)}
              className="glass rounded-full p-2.5 text-offwhite/80 hover:text-offwhite"
              aria-label="Settings"
            >
              <FiSettings size={18} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="glass rounded-full w-10 h-10 flex items-center justify-center text-offwhite/80 hover:text-offwhite transition-colors"
              aria-label="Profile"
            >
              <FiUser size={18} />
            </button>
          </motion.nav>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 w-80 max-w-[90vw]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Settings</h3>
                <button onClick={() => setSettingsOpen(false)} aria-label="Close settings">
                  <FiX size={18} />
                </button>
              </div>
              <p className="text-sm text-offwhite/70 mb-4">
                Signed in as {user?.email || user?.username || 'guest'}
              </p>
              <button
                onClick={() => {
                  logout()
                  setSettingsOpen(false)
                  navigate('/login')
                }}
                className="w-full flex items-center justify-center gap-2 bg-coral-500/80 hover:bg-coral-500 text-walnut-950 rounded-lg py-2 text-sm font-medium"
              >
                <FiLogOut size={16} /> Log out
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
