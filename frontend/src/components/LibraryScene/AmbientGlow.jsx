import { motion } from 'framer-motion'

// A fully custom, theme-aware ambient background — soft blurred color blobs
// drifting slowly over a solid base. Built entirely from CSS colors instead
// of a photograph, so there's no fixed exposure to fight: each color is
// either a theme CSS variable (already correct in both light/dark, same
// system the rest of the app uses) or a low, constant opacity that reads
// gently in both modes by construction.
export default function AmbientGlow({ colors, className = '' }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[100px]"
          style={{
            background: color,
            width: '45vw',
            height: '45vw',
            left: `${[10, 60, 30, 75][i % 4]}%`,
            top: `${[10, 15, 60, 55][i % 4]}%`,
          }}
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 26 + i * 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
