import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiPlay, FiChevronDown } from 'react-icons/fi'
import AmbientGlow from '../components/LibraryScene/AmbientGlow'
import ThemeToggle from '../components/Navbar/ThemeToggle'
import { startAudioEngine } from '../hooks/useProceduralAudio'

// Fixed low-opacity glow colors — warm coral/blue instead of the lofi
// magenta/violet palette — reads gently in both themes by construction,
// no photograph to fight for correct exposure.
const GLOW_COLORS = [
  'rgba(255,128,102,0.16)',
  'rgba(127,179,224,0.18)',
  'rgba(52,211,153,0.12)',
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
}

export default function LandingPage() {
  const navigate = useNavigate()

  const handleStart = () => {
    startAudioEngine()
    navigate('/study')
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-walnut-950">
      <AmbientGlow colors={GLOW_COLORS} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-walnut-950/30 to-walnut-950" />

      <ThemeToggle className="fixed top-4 right-4 z-20" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pb-24"
      >
        <motion.span
          variants={item}
          className="text-xs uppercase tracking-[0.35em] text-accent-blue mb-5 font-medium"
        >
          A quiet place to focus
        </motion.span>
        <motion.h1
          variants={item}
          className="text-5xl sm:text-7xl font-extrabold text-offwhite mb-5 max-w-3xl leading-[1.05] tracking-tight"
        >
          Your Virtual
          <br className="hidden sm:block" /> Study Library
        </motion.h1>
        <motion.p variants={item} className="text-offwhite/70 max-w-lg mb-10 text-base sm:text-xl leading-relaxed">
          Ambient sounds, a gentle pomodoro timer, and a cozy library atmosphere —
          everything you need to slip into deep focus.
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-4">
          <motion.button
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={handleStart}
            className="glass rounded-full px-8 py-4 flex items-center gap-3 text-lg font-semibold shadow-2xl hover:shadow-accent-blue/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            <FiPlay size={20} />
            Start Focus Session
          </motion.button>
        </motion.div>

        <motion.div
          variants={item}
          animate={{ y: [0, 8, 0] }}
          transition={{ y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
          className="absolute bottom-8 flex flex-col items-center gap-1 text-offwhite/55"
        >
          <span className="text-[10px] uppercase tracking-[0.25em]">Explore</span>
          <FiChevronDown size={16} />
        </motion.div>
      </motion.div>
    </div>
  )
}
