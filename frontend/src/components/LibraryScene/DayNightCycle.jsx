import { useEffect, useState } from 'react'

const PERIODS = {
  morning: 'linear-gradient(180deg, #7fb3e0 0%, #ffd9a0 60%, #2b1d14 100%)',
  afternoon: 'linear-gradient(180deg, #5f9fd6 0%, #cfe6f5 60%, #2b1d14 100%)',
  sunset: 'linear-gradient(180deg, #ff8066 0%, #ffb56b 55%, #2b1d14 100%)',
  evening: 'linear-gradient(180deg, #453263 0%, #7a4f5e 55%, #1f140d 100%)',
  night: 'linear-gradient(180deg, #0e0a17 0%, #1f1430 55%, #1f140d 100%)',
}

function getPeriod(hour) {
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 16) return 'afternoon'
  if (hour >= 16 && hour < 19) return 'sunset'
  if (hour >= 19 && hour < 22) return 'evening'
  return 'night'
}

export function useDayNightGradient() {
  const [period, setPeriod] = useState(() => getPeriod(new Date().getHours()))

  useEffect(() => {
    const interval = setInterval(() => {
      setPeriod(getPeriod(new Date().getHours()))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return PERIODS[period]
}

export default function DayNightCycle({ children }) {
  const gradient = useDayNightGradient()
  return (
    <div
      className="absolute inset-0"
      style={{ background: gradient, transition: 'background 3s ease' }}
    >
      {children}
    </div>
  )
}
