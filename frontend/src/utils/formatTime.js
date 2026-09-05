export function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function getDayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

// Local calendar-day key (YYYY-MM-DD). Deliberately NOT date.toISOString(),
// which is UTC and shifts the date near midnight for any non-UTC timezone.
export function localDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
