import { motion } from 'framer-motion'

const bookColors = ['#7fb3e0', '#ff8066', '#34d399', '#c9a15c', '#8b6f52', '#a5674f']

function Shelf({ seed }) {
  const books = Array.from({ length: 14 }, (_, i) => ({
    width: 6 + ((seed + i * 7) % 10),
    height: 60 + ((seed + i * 13) % 40),
    color: bookColors[(seed + i) % bookColors.length],
  }))
  return (
    <div className="flex items-end gap-1 h-24">
      {books.map((b, i) => (
        <div
          key={i}
          style={{ width: b.width, height: b.height, backgroundColor: b.color }}
          className="opacity-70 rounded-t-sm"
        />
      ))}
    </div>
  )
}

export default function BookshelfLayer() {
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pointer-events-none opacity-40"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 0.4 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      <Shelf seed={1} />
      <div className="hidden md:block">
        <Shelf seed={5} />
      </div>
      <Shelf seed={9} />
    </motion.div>
  )
}
