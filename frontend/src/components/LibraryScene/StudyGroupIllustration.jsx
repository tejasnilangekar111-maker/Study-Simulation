import { useMemo } from 'react'
import { motion } from 'framer-motion'

// Flat, geometric, rounded-silhouette illustration of students studying
// together at a table. Original hand-built SVG — no external assets.
// Each figure gets independently randomized idle-motion timing (consistent
// with StudentAnimations.jsx's per-figure randomization convention).

function useRandomTiming(base, variance, count) {
  return useMemo(
    () =>
      Array.from({ length: count }, () => ({
        duration: base + Math.random() * variance,
        delay: Math.random() * 2,
      })),
    [base, variance, count]
  )
}

function Steam({ x, delay }) {
  return (
    <motion.g opacity={0.55}>
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={0}
          r={2.4 - i * 0.4}
          fill="#f5efe6"
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -26, opacity: [0, 0.6, 0], x: [0, i % 2 === 0 ? 4 : -4, 0] }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            delay: delay + i * 1.05,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.g>
  )
}

function Figure({ transform, bodyColor, skinColor, activity, timing }) {
  return (
    <motion.g
      transform={transform}
      animate={{ y: [0, -2.5, 0] }}
      transition={{ duration: timing.duration, delay: timing.delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* chair/body shadow */}
      <ellipse cx="0" cy="58" rx="24" ry="5" fill="#000" opacity="0.18" />

      {/* torso */}
      <rect x="-16" y="14" width="32" height="42" rx="14" fill={bodyColor} />

      {/* head with gentle tilt for 'headTilt' activity */}
      <motion.g
        animate={
          activity === 'headTilt'
            ? { rotate: [0, 6, -3, 0] }
            : { rotate: 0 }
        }
        transition={{ duration: 4.5, delay: timing.delay, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '0px 0px' }}
        transform="translate(0,-2)"
      >
        <circle cx="0" cy="0" r="13" fill={skinColor} />
        {/* simple hair cap */}
        <path d="M -13 -3 A 13 13 0 0 1 13 -3 L 13 -8 A 13 10 0 0 0 -13 -8 Z" fill={bodyColor} opacity="0.85" />
      </motion.g>

      {/* writing hand + pen */}
      {activity === 'writing' && (
        <motion.g
          animate={{ x: [0, 5, 0], y: [0, -1.5, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: timing.delay }}
        >
          <rect x="10" y="34" width="16" height="4" rx="2" fill={skinColor} />
          <rect x="24" y="32" width="3" height="9" rx="1.5" fill="#ff8066" />
        </motion.g>
      )}

      {/* page turning hand flick */}
      {activity === 'pageTurn' && (
        <motion.g
          style={{ transformOrigin: '14px 36px' }}
          animate={{ rotate: [0, -18, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: timing.delay }}
        >
          <rect x="6" y="34" width="16" height="4" rx="2" fill={skinColor} />
        </motion.g>
      )}

      {/* typing hands */}
      {activity === 'typing' && (
        <g>
          {[0, 1].map((i) => (
            <motion.rect
              key={i}
              x={-4 + i * 12}
              y="34"
              width="8"
              height="4"
              rx="2"
              fill={skinColor}
              animate={{ y: [34, 31, 34] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: timing.delay + i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </g>
      )}
    </motion.g>
  )
}

export default function StudyGroupIllustration({ className = '', style }) {
  const activities = ['writing', 'pageTurn', 'typing', 'headTilt']
  const timings = useRandomTiming(3.2, 2.4, 4)

  const figures = [
    { transform: 'translate(130,150)', bodyColor: '#4a3320', skinColor: '#e8b88a', activity: activities[0] },
    { transform: 'translate(230,158)', bodyColor: '#7fb3e0', skinColor: '#caa07a', activity: activities[1] },
    { transform: 'translate(330,150)', bodyColor: '#ff8066', skinColor: '#e8b88a', activity: activities[2] },
    { transform: 'translate(420,158)', bodyColor: '#34d399', skinColor: '#caa07a', activity: activities[3] },
  ]

  return (
    <svg
      viewBox="0 0 560 260"
      className={className}
      style={style}
      role="img"
      aria-label="Illustration of students studying together at a table"
    >
      <defs>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd9a8" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#ffb066" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffb066" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tableWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a3320" />
          <stop offset="100%" stopColor="#2b1d14" />
        </linearGradient>
      </defs>

      {/* ambient lamp glow */}
      <motion.circle
        cx="470"
        cy="60"
        r="70"
        fill="url(#lampGlow)"
        animate={{ opacity: [0.6, 0.95, 0.6], scale: [1, 1.06, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* lamp fixture */}
      <g transform="translate(470,40)">
        <rect x="-2" y="0" width="4" height="30" fill="#3a2818" />
        <path d="M -16 0 L 16 0 L 8 -20 L -8 -20 Z" fill="#3a2818" />
      </g>

      {/* table */}
      <rect x="90" y="196" width="380" height="16" rx="6" fill="url(#tableWood)" />
      <rect x="105" y="212" width="10" height="34" fill="#2b1d14" />
      <rect x="445" y="212" width="10" height="34" fill="#2b1d14" />

      {/* books / mugs on table */}
      <rect x="150" y="184" width="34" height="12" rx="2" fill="#ff8066" opacity="0.85" />
      <rect x="188" y="188" width="28" height="8" rx="2" fill="#7fb3e0" opacity="0.8" />
      <g transform="translate(280,182)">
        <rect x="-8" y="0" width="16" height="14" rx="3" fill="#f5efe6" opacity="0.9" />
        <Steam x="0" delay={0} />
      </g>
      <rect x="360" y="186" width="30" height="10" rx="2" fill="#34d399" opacity="0.8" />
      <g transform="translate(410,180)">
        <rect x="-7" y="0" width="14" height="16" rx="3" fill="#f5efe6" opacity="0.85" />
        <Steam x="0" delay={1.4} />
      </g>

      {/* figures seated at table */}
      {figures.map((f, i) => (
        <Figure key={i} {...f} timing={timings[i]} />
      ))}
    </svg>
  )
}
