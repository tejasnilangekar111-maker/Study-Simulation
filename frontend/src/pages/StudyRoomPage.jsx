import { motion } from 'framer-motion'
import LofiScene from '../components/LibraryScene/LofiScene'
import StudentSilhouette from '../components/StudentAnimations/StudentSilhouette'
import PomodoroTimer from '../components/Pomodoro/PomodoroTimer'
import SoundMixer from '../components/SoundMixer/SoundMixer'
import GrowthPlant from '../components/Growth/GrowthPlant'
import QuoteDisplay from '../components/Motivation/QuoteDisplay'
import SleepReminderBanner from '../components/Motivation/SleepReminderBanner'
import Navbar from '../components/Navbar/Navbar'
import Sidebar from '../components/Sidebar/Sidebar'
import { useFocusMode } from '../hooks/useFocusMode'

const students = [
  { left: '8%', bottom: '4%', scale: 1, color: '#2c1a4a' },
  { left: '78%', bottom: '6%', scale: 0.9, color: '#2c1a4a' },
  { left: '35%', bottom: '2%', scale: 0.8, color: '#2c1a4a' },
]

export default function StudyRoomPage() {
  const focusMode = useFocusMode()

  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-lofi-950 ${focusMode ? 'cursor-none-all' : ''}`}>
      <LofiScene>
        {students.map((s, i) => (
          <StudentSilhouette key={i} {...s} />
        ))}
      </LofiScene>

      <motion.div
        animate={{ opacity: focusMode ? 0.55 : 0 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 bg-lofi-950 pointer-events-none z-10"
      />

      <Navbar />
      <Sidebar />
      {!focusMode && <QuoteDisplay />}
      {!focusMode && <SleepReminderBanner />}

      <PomodoroTimer />
      <SoundMixer />
      <GrowthPlant />
    </div>
  )
}
