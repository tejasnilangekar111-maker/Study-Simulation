import { useEffect } from 'react'
import { useIdleDetection } from './useIdleDetection'
import { useUiStore } from '../store/uiStore'

export function useFocusMode() {
  const isIdle = useIdleDetection()
  const setFocusMode = useUiStore((s) => s.setFocusMode)

  useEffect(() => {
    setFocusMode(isIdle)
  }, [isIdle, setFocusMode])

  return useUiStore((s) => s.focusMode)
}
