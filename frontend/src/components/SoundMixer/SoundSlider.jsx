import { FiVolume2, FiVolumeX } from 'react-icons/fi'
import { useSoundStore } from '../../store/soundStore'
import { startAudioEngine } from '../../hooks/useProceduralAudio'

export default function SoundSlider({ channel }) {
  const { key, label } = channel
  const volume = useSoundStore((s) => s.channels[key]?.volume ?? 0)
  const muted = useSoundStore((s) => s.channels[key]?.muted ?? false)
  const setVolume = useSoundStore((s) => s.setVolume)
  const toggleMute = useSoundStore((s) => s.toggleMute)

  return (
    <div className="flex items-center gap-3 py-1.5">
      <button
        onClick={() => {
          startAudioEngine()
          toggleMute(key)
        }}
        className="text-offwhite/70 hover:text-accent-blue transition-colors shrink-0"
        aria-label={`Mute ${label}`}
      >
        {muted || volume === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
      </button>
      <span className="text-xs text-offwhite/80 w-28 shrink-0 truncate">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => {
          startAudioEngine()
          setVolume(key, Number(e.target.value))
        }}
        className="w-full accent-accent-blue h-1 cursor-pointer"
      />
    </div>
  )
}
