import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiPlay, FiChevronDown, FiLogIn } from 'react-icons/fi'
import LibraryScene from '../components/LibraryScene/LibraryScene'
import StudyGroupIllustration from '../components/LibraryScene/StudyGroupIllustration'
import { startAudioEngine } from '../hooks/useProceduralAudio'

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
      <LibraryScene showWindow={false} />

      {/* Study-group illustration, anchored low so it reads as a library desk
          scene beneath the hero copy, composed under the rain/dust/light layers. */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 0.9, y: 0 }}
        transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
        className="absolute bottom-0 left-0 right-0 z-[5] pointer-events-none flex justify-center"
      >
        <StudyGroupIllustration className="w-full max-w-3xl opacity-90" />
      </motion.div>

      {/* Scrim so the hero copy stays legible over the illustration/scene */}
      <div className="absolute inset-0 z-[6] bg-gradient-to-b from-walnut-950/20 via-walnut-950/10 to-walnut-950/95 pointer-events-none" />

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
            className="glass rounded-full px-8 py-4 flex items-center gap-3 text-lg font-semibold shadow-2xl hover:shadow-accent-blue/20"
          >
            <FiPlay size={20} />
            Start Focus Session
          </motion.button>

          <motion.button
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => navigate('/login')}
            className="rounded-full px-6 py-3.5 flex items-center gap-2 text-sm font-medium text-offwhite/70 hover:text-offwhite border border-white/15 hover:border-white/30 transition-colors"
          >
            <FiLogIn size={16} />
            Sign in
          </motion.button>
        </motion.div>

        <motion.div
          variants={item}
          animate={{ y: [0, 8, 0] }}
          transition={{ y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
          className="absolute bottom-8 flex flex-col items-center gap-1 text-offwhite/40"
        >
          <span className="text-[10px] uppercase tracking-[0.25em]">Explore</span>
          <FiChevronDown size={16} />
        </motion.div>
      </motion.div>
    </div>
  )
}
