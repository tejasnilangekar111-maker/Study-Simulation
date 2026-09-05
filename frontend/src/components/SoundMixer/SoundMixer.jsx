import { AnimatePresence, motion } from 'framer-motion'
import { FiMusic, FiChevronDown } from 'react-icons/fi'
import { useSoundStore } from '../../store/soundStore'
import { SOUND_CHANNELS } from '../../utils/constants'
import { useProceduralAudio, startAudioEngine } from '../../hooks/useProceduralAudio'
import SoundSlider from './SoundSlider'

export default function SoundMixer() {
  const mixerOpen = useSoundStore((s) => s.mixerOpen)
  const toggleMixer = useSoundStore((s) => s.toggleMixer)

  // Keeps the Web Audio engine's channel gains in sync with the store.
  useProceduralAudio()

  const handleToggle = () => {
    startAudioEngine() // no-op after first call; must originate from a user gesture
    toggleMixer()
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {mixerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="glass rounded-2xl p-4 w-72 max-w-[85vw] shadow-2xl"
          >
            <h3 className="text-sm font-semibold text-offwhite/90 mb-2">Ambient Sounds</h3>
            <div className="max-h-72 overflow-y-auto pr-1">
              {SOUND_CHANNELS.map((channel) => (
                <SoundSlider key={channel.key} channel={channel} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleToggle}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="glass rounded-full p-3.5 shadow-xl text-offwhite flex items-center gap-2"
        aria-label="Toggle sound mixer"
      >
        <FiMusic size={20} />
        <motion.span animate={{ rotate: mixerOpen ? 180 : 0 }}>
          <FiChevronDown size={16} />
        </motion.span>
      </motion.button>
    </div>
  )
}
