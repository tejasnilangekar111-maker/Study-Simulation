import { motion } from 'framer-motion'

export default function LightRays() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute top-0 h-[140%] w-40 origin-top"
          style={{
            left: `${15 + i * 28}%`,
            background:
              'linear-gradient(180deg, rgba(255,240,210,0.16) 0%, rgba(255,240,210,0.04) 45%, transparent 80%)',
            transform: 'skewX(-12deg)',
            filter: 'blur(6px)',
          }}
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
