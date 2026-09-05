import { useEffect } from 'react'
import { useSoundStore } from '../store/soundStore'
import { ensureStarted, setChannelVolume } from '../services/audioEngine'
import { SOUND_CHANNELS } from '../utils/constants'

// Keeps every procedural sound channel's gain node in sync with soundStore.
// The AudioContext itself is only created/resumed on a user gesture via
// startAudioEngine() (exported below) — call it from a click handler.
export function useProceduralAudio() {
  const channels = useSoundStore((s) => s.channels)

  useEffect(() => {
    SOUND_CHANNELS.forEach(({ key }) => {
      const ch = channels[key]
      if (!ch) return
      const effective = ch.muted ? 0 : ch.volume
      setChannelVolume(key, effective)
    })
  }, [channels])
}

export function startAudioEngine() {
  ensureStarted()
}
