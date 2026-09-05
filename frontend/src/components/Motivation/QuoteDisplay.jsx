import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOTIVATIONAL_QUOTES } from '../../utils/quotes'

const ROTATE_MS = 20000

export default function QuoteDisplay() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length))

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % MOTIVATIONAL_QUOTES.length)
    }, ROTATE_MS)
    return () => clearInterval(interval)
  }, [])

  const quote = MOTIVATIONAL_QUOTES[index]

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 px-4 w-full max-w-xl pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="glass rounded-xl px-5 py-3 text-center shadow-xl"
        >
          <p className="text-sm sm:text-base text-offwhite/90 italic leading-snug">"{quote.text}"</p>
          <p className="text-[11px] text-offwhite/50 mt-1.5 uppercase tracking-wide">{quote.author}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
