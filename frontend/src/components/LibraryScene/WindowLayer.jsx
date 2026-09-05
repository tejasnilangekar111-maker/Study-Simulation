import { motion } from 'framer-motion'
import RainLayer from './RainLayer'

export default function WindowLayer({ skyGradient }) {
  return (
    <motion.div
      className="absolute top-[8%] right-[8%] w-[38%] max-w-md aspect-[4/5] rounded-lg overflow-hidden border-4 border-walnut-800/80 shadow-2xl hidden sm:block"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <div className="absolute inset-0" style={{ background: skyGradient, transition: 'background 3s ease' }} />
      <RainLayer intensity={0.6} />
      {/* window mullions */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border border-walnut-800/70" />
        ))}
      </div>
    </motion.div>
  )
}
