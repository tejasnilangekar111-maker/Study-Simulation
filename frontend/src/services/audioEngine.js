// Procedurally synthesized ambient sound engine using the native Web Audio API.
// No external audio files. Each channel is an independent, looping/self-scheduling
// synthesis graph feeding a per-channel GainNode, mixed into a master GainNode.
//
// AudioContext is created lazily on first user gesture (call ensureStarted()).

let ctx = null
let masterGain = null
const channels = {} // key -> { gain, stop(), lastVolume }
let started = false

function createNoiseBuffer(context, seconds = 2) {
  const bufferSize = Math.floor(context.sampleRate * seconds)
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function makeNoiseSource(context, buffer) {
  const src = context.createBufferSource()
  src.buffer = buffer
  src.loop = true
  return src
}

function rand(min, max) {
  return min + Math.random() * (max - min)
}

// ---- Individual channel builders -----------------------------------------
// Each returns { output: AudioNode, stop: () => void }

function buildRain(context, noiseBuffer) {
  const src = makeNoiseSource(context, noiseBuffer)
  const bandpass = context.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 3200
  bandpass.Q.value = 0.6

  const lowpass = context.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 6000

  const shaping = context.createGain()
  shaping.gain.value = 1.4

  src.connect(bandpass)
  bandpass.connect(lowpass)
  lowpass.connect(shaping)
  src.start()

  return { output: shaping, stop: () => src.stop() }
}

function buildWhiteNoise(context, noiseBuffer) {
  const src = makeNoiseSource(context, noiseBuffer)
  const gain = context.createGain()
  gain.gain.value = 0.5
  src.connect(gain)
  src.start()
  return { output: gain, stop: () => src.stop() }
}

function buildWind(context, noiseBuffer) {
  const src = makeNoiseSource(context, noiseBuffer)
  const lowpass = context.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 500
  lowpass.Q.value = 4

  const lfo = context.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.08
  const lfoGain = context.createGain()
  lfoGain.gain.value = 350
  lfo.connect(lfoGain)
  lfoGain.connect(lowpass.frequency)

  const shaping = context.createGain()
  shaping.gain.value = 1.2

  src.connect(lowpass)
  lowpass.connect(shaping)
  src.start()
  lfo.start()

  return {
    output: shaping,
    stop: () => {
      src.stop()
      lfo.stop()
    },
  }
}

function buildFireplace(context, noiseBuffer) {
  const bedSrc = makeNoiseSource(context, noiseBuffer)
  const bedFilter = context.createBiquadFilter()
  bedFilter.type = 'lowpass'
  bedFilter.frequency.value = 400
  const bedGain = context.createGain()
  bedGain.gain.value = 0.5

  bedSrc.connect(bedFilter)
  bedFilter.connect(bedGain)
  bedSrc.start()

  const output = context.createGain()
  output.gain.value = 1
  bedGain.connect(output)

  let timeoutId
  let stopped = false

  const scheduleCrackle = () => {
    if (stopped) return
    const delay = rand(60, 400)
    timeoutId = setTimeout(() => {
      if (stopped) return
      const now = context.currentTime
      const crackle = context.createBufferSource()
      crackle.buffer = noiseBuffer
      const hp = context.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = rand(1500, 4000)
      const g = context.createGain()
      const peak = rand(0.15, 0.5)
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(peak, now + 0.005)
      g.gain.exponentialRampToValueAtTime(0.001, now + rand(0.04, 0.15))
      crackle.connect(hp)
      hp.connect(g)
      g.connect(output)
      crackle.start(now)
      crackle.stop(now + 0.2)
      scheduleCrackle()
    }, delay)
  }
  scheduleCrackle()

  return {
    output,
    stop: () => {
      stopped = true
      clearTimeout(timeoutId)
      bedSrc.stop()
    },
  }
}

function buildClock(context) {
  const output = context.createGain()
  output.gain.value = 1
  let stopped = false
  let nextTickTime = context.currentTime
  const interval = 1.0
  const lookahead = 0.15
  let schedulerId

  const scheduleTick = (time) => {
    const osc = context.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 1500
    const g = context.createGain()
    g.gain.setValueAtTime(0.0001, time)
    g.gain.linearRampToValueAtTime(0.6, time + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.035)
    osc.connect(g)
    g.connect(output)
    osc.start(time)
    osc.stop(time + 0.04)
  }

  const scheduler = () => {
    if (stopped) return
    while (nextTickTime < context.currentTime + lookahead) {
      scheduleTick(nextTickTime)
      nextTickTime += interval
    }
    schedulerId = setTimeout(scheduler, 30)
  }
  scheduler()

  return {
    output,
    stop: () => {
      stopped = true
      clearTimeout(schedulerId)
    },
  }
}

function buildKeyboard(context, noiseBuffer) {
  const output = context.createGain()
  output.gain.value = 1
  let stopped = false
  let timeoutId

  const scheduleClick = () => {
    if (stopped) return
    const delay = rand(50, 260)
    timeoutId = setTimeout(() => {
      if (stopped) return
      const now = context.currentTime
      const src = context.createBufferSource()
      src.buffer = noiseBuffer
      const bp = context.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = rand(1800, 3500)
      bp.Q.value = 2
      const g = context.createGain()
      const peak = rand(0.2, 0.5)
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(peak, now + 0.002)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
      src.connect(bp)
      bp.connect(g)
      g.connect(output)
      src.start(now)
      src.stop(now + 0.05)
      scheduleClick()
    }, delay)
  }
  scheduleClick()

  return {
    output,
    stop: () => {
      stopped = true
      clearTimeout(timeoutId)
    },
  }
}

function buildPages(context, noiseBuffer) {
  const output = context.createGain()
  output.gain.value = 1
  let stopped = false
  let timeoutId

  const scheduleFlick = () => {
    if (stopped) return
    const delay = rand(4000, 12000)
    timeoutId = setTimeout(() => {
      if (stopped) return
      const now = context.currentTime
      const src = context.createBufferSource()
      src.buffer = noiseBuffer
      const bp = context.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = rand(2000, 4500)
      bp.Q.value = 0.8
      const g = context.createGain()
      const peak = rand(0.25, 0.45)
      const dur = rand(0.18, 0.32)
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(peak, now + dur * 0.3)
      g.gain.linearRampToValueAtTime(0.0001, now + dur)
      src.connect(bp)
      bp.connect(g)
      g.connect(output)
      src.start(now)
      src.stop(now + dur + 0.05)
      scheduleFlick()
    }, delay)
  }
  scheduleFlick()

  return {
    output,
    stop: () => {
      stopped = true
      clearTimeout(timeoutId)
    },
  }
}

function buildBirds(context) {
  const output = context.createGain()
  output.gain.value = 1
  let stopped = false
  let timeoutId

  const scheduleChirp = () => {
    if (stopped) return
    const delay = rand(700, 3500)
    timeoutId = setTimeout(() => {
      if (stopped) return
      const bursts = 1 + Math.floor(Math.random() * 3)
      for (let i = 0; i < bursts; i++) {
        const now = context.currentTime + i * rand(0.08, 0.16)
        const osc = context.createOscillator()
        osc.type = Math.random() > 0.5 ? 'sine' : 'triangle'
        const startFreq = rand(2000, 3200)
        const endFreq = startFreq + rand(-800, 900)
        osc.frequency.setValueAtTime(startFreq, now)
        osc.frequency.exponentialRampToValueAtTime(Math.max(400, endFreq), now + rand(0.08, 0.16))
        const g = context.createGain()
        g.gain.setValueAtTime(0, now)
        g.gain.linearRampToValueAtTime(rand(0.15, 0.3), now + 0.01)
        g.gain.exponentialRampToValueAtTime(0.001, now + rand(0.12, 0.2))
        osc.connect(g)
        g.connect(output)
        osc.start(now)
        osc.stop(now + 0.25)
      }
      scheduleChirp()
    }, delay)
  }
  scheduleChirp()

  return {
    output,
    stop: () => {
      stopped = true
      clearTimeout(timeoutId)
    },
  }
}

function buildCafe(context, noiseBuffer) {
  const src = makeNoiseSource(context, noiseBuffer)
  const lowpass = context.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 900
  lowpass.Q.value = 0.5

  const murmurGain = context.createGain()
  murmurGain.gain.value = 0.5

  src.connect(lowpass)
  lowpass.connect(murmurGain)
  src.start()

  // Slow random amplitude modulation for a "murmur" texture.
  let stopped = false
  let timeoutId
  const modulate = () => {
    if (stopped) return
    const now = context.currentTime
    const target = rand(0.25, 0.7)
    murmurGain.gain.linearRampToValueAtTime(target, now + rand(0.6, 1.6))
    timeoutId = setTimeout(modulate, rand(600, 1600))
  }
  modulate()

  const output = context.createGain()
  output.gain.value = 1
  murmurGain.connect(output)

  return {
    output,
    stop: () => {
      stopped = true
      clearTimeout(timeoutId)
      src.stop()
    },
  }
}

const BUILDERS = {
  rain: (context, noiseBuffer) => buildRain(context, noiseBuffer),
  whitenoise: (context, noiseBuffer) => buildWhiteNoise(context, noiseBuffer),
  wind: (context, noiseBuffer) => buildWind(context, noiseBuffer),
  fireplace: (context, noiseBuffer) => buildFireplace(context, noiseBuffer),
  clock: (context) => buildClock(context),
  keyboard: (context, noiseBuffer) => buildKeyboard(context, noiseBuffer),
  pages: (context, noiseBuffer) => buildPages(context, noiseBuffer),
  birds: (context) => buildBirds(context),
  cafe: (context, noiseBuffer) => buildCafe(context, noiseBuffer),
}

function buildChannel(key) {
  if (!ctx || channels[key]) return
  const noiseBuffer = createNoiseBuffer(ctx, 2)
  const builder = BUILDERS[key]
  if (!builder) return
  const { output, stop } = builder(ctx, noiseBuffer)
  const gain = ctx.createGain()
  gain.gain.value = 0 // start silent; ramp on volume update
  output.connect(gain)
  gain.connect(masterGain)
  channels[key] = { gain, stop, lastVolume: 0 }
}

/**
 * Must be called from within a user gesture handler (click/tap) before any
 * channel volume changes will produce audible sound — satisfies autoplay policy.
 */
export function ensureStarted() {
  if (started) {
    if (ctx && ctx.state === 'suspended') ctx.resume()
    return
  }
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    ctx = new AudioContextClass()
    masterGain = ctx.createGain()
    masterGain.gain.value = 1
    masterGain.connect(ctx.destination)
    Object.keys(BUILDERS).forEach(buildChannel)
    started = true
  } catch {
    /* Web Audio unavailable — fail silently. */
  }
}

export function isStarted() {
  return started
}

/**
 * Set a channel's effective volume (0-1). Applies a short linear ramp to
 * avoid clicks/pops. Safe to call before ensureStarted() (no-op until then).
 */
export function setChannelVolume(key, volume) {
  if (!ctx || !channels[key]) return
  const clamped = Math.max(0, Math.min(1, volume))
  const now = ctx.currentTime
  channels[key].gain.gain.cancelScheduledValues(now)
  channels[key].gain.gain.setValueAtTime(channels[key].gain.gain.value, now)
  channels[key].gain.gain.linearRampToValueAtTime(clamped, now + 0.08)
  channels[key].lastVolume = clamped
}

export function stopAll() {
  Object.values(channels).forEach((ch) => {
    try {
      ch.stop()
    } catch {
      /* ignore */
    }
  })
  Object.keys(channels).forEach((k) => delete channels[k])
  if (ctx) {
    try {
      ctx.close()
    } catch {
      /* ignore */
    }
  }
  ctx = null
  masterGain = null
  started = false
}
