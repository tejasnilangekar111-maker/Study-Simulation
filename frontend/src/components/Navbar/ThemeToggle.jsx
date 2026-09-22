import { AnimatePresence, motion } from 'framer-motion'
import { FiSun, FiMoon } from 'react-icons/fi'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle({ className = '' }) {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  return (
    <button
      onClick={toggleTheme}
      className={`glass rounded-full p-2.5 text-offwhite/80 hover:text-offwhite focus-visible:outline-none ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.25 }}
          className="block"
        >
          {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
