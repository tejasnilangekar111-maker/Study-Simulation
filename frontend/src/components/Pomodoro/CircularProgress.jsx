const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function CircularProgress({ progress, color = '#ff8066', size = 130 }) {
  const offset = CIRCUMFERENCE * (1 - progress)
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90">
      <circle
        cx="60"
        cy="60"
        r={RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="8"
      />
      <circle
        cx="60"
        cy="60"
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.6s ease' }}
      />
    </svg>
  )
}
