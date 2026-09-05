import { useEffect, useRef } from 'react'
import { Howl } from 'howler'

// Wraps a Howler instance for a looping ambient sound; never throws even if the
// audio file is missing (404) — onloaderror is caught silently.
export function useHowlerSound(src, { volume = 0, muted = false, loop = true } = {}) {
  const howlRef = useRef(null)
  const idRef = useRef(null)

  useEffect(() => {
    let disposed = false
    try {
      const howl = new Howl({
        src: [src],
        loop,
        volume: 0,
        onloaderror: () => {
          // Fail silently — placeholder audio files may not exist yet.
        },
        onplayerror: () => {
          try {
            howl.once('unlock', () => {
              if (!disposed) howl.play()
            })
          } catch {
            /* ignore */
          }
        },
      })
      howlRef.current = howl
    } catch {
      howlRef.current = null
    }

    return () => {
      disposed = true
      try {
        howlRef.current?.stop()
        howlRef.current?.unload()
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  useEffect(() => {
    const howl = howlRef.current
    if (!howl) return
    const effectiveVolume = muted ? 0 : volume
    try {
      howl.volume(effectiveVolume)
      if (effectiveVolume > 0 && !howl.playing(idRef.current)) {
        idRef.current = howl.play()
      } else if (effectiveVolume === 0 && howl.playing(idRef.current)) {
        howl.pause(idRef.current)
      }
    } catch {
      /* ignore */
    }
  }, [volume, muted])
}

export function playOneShot(src) {
  try {
    const howl = new Howl({
      src: [src],
      volume: 0.6,
      onloaderror: () => {},
    })
    howl.play()
  } catch {
    /* ignore */
  }
}
