export const SOUND_CHANNELS = [
  { key: 'rain', label: 'Rain', src: '/sounds/rain.mp3' },
  { key: 'fireplace', label: 'Fireplace', src: '/sounds/fireplace.mp3' },
  { key: 'pages', label: 'Turning Pages', src: '/sounds/pages.mp3' },
  { key: 'keyboard', label: 'Keyboard', src: '/sounds/keyboard.mp3' },
  { key: 'clock', label: 'Clock Tick', src: '/sounds/clock.mp3' },
  { key: 'birds', label: 'Birds', src: '/sounds/birds.mp3' },
  { key: 'wind', label: 'Wind', src: '/sounds/wind.mp3' },
  { key: 'cafe', label: 'Cafe Chatter', src: '/sounds/cafe.mp3' },
  { key: 'whitenoise', label: 'White Noise', src: '/sounds/whitenoise.mp3' },
]

export const DEFAULT_WORK_MINUTES = 25
export const DEFAULT_BREAK_MINUTES = 5

export const IDLE_TIMEOUT_MS = 10000

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
