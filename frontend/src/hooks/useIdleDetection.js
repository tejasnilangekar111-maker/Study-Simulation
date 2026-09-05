import { useEffect, useRef, useState } from 'react'
import { IDLE_TIMEOUT_MS } from '../utils/constants'

export function useIdleDetection(timeout = IDLE_TIMEOUT_MS) {
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const resetTimer = () => {
      setIsIdle(false)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setIsIdle(true), timeout)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((evt) => window.addEventListener(evt, resetTimer))
    resetTimer()

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeout])

  return isIdle
}
