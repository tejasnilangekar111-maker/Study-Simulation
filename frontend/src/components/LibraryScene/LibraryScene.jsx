import DayNightCycle, { useDayNightGradient } from './DayNightCycle'
import RainLayer from './RainLayer'
import DustParticles from './DustParticles'
import LightRays from './LightRays'
import BookshelfLayer from './BookshelfLayer'
import WindowLayer from './WindowLayer'

export default function LibraryScene({ animated = true, showWindow = true, children }) {
  const skyGradient = useDayNightGradient()

  return (
    <div className="absolute inset-0 overflow-hidden">
      <DayNightCycle>
        <LightRays />
        <DustParticles />
        {animated && <RainLayer intensity={0.5} />}
        <BookshelfLayer />
        {showWindow && <WindowLayer skyGradient={skyGradient} />}
        <div className="absolute inset-0 bg-gradient-to-b from-walnut-950/10 via-transparent to-walnut-950/80" />
        {children}
      </DayNightCycle>
    </div>
  )
}
