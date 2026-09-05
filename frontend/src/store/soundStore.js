import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SOUND_CHANNELS } from '../utils/constants'

const defaultChannels = SOUND_CHANNELS.reduce((acc, ch) => {
  acc[ch.key] = { volume: 0, muted: false }
  return acc
}, {})

export const useSoundStore = create(
  persist(
    (set) => ({
      channels: defaultChannels,
      mixerOpen: false,
      setVolume: (key, volume) =>
        set((state) => ({
          channels: { ...state.channels, [key]: { ...state.channels[key], volume } },
        })),
      toggleMute: (key) =>
        set((state) => ({
          channels: {
            ...state.channels,
            [key]: { ...state.channels[key], muted: !state.channels[key].muted },
          },
        })),
      toggleMixer: () => set((state) => ({ mixerOpen: !state.mixerOpen })),
    }),
    { name: 'sound-storage' }
  )
)
