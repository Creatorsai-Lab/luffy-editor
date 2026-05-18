const SAMPLES = 2000

export interface WaveformData {
  samples: Float32Array
  duration: number
}

type CacheEntry = WaveformData | null | Promise<WaveformData | null>
const cache = new Map<string, CacheEntry>()

export function getWaveform(url: string): Promise<WaveformData | null> {
  const hit = cache.get(url)
  if (hit !== undefined) {
    return hit instanceof Promise ? hit : Promise.resolve(hit)
  }

  const promise = decodeAudio(url).then(result => {
    cache.set(url, result)
    return result
  })

  cache.set(url, promise)
  return promise
}

async function decodeAudio(url: string): Promise<WaveformData | null> {
  try {
    const res = await fetch(url)
    const arrayBuffer = await res.arrayBuffer()
    const ctx = new AudioContext()
    let audioBuffer: AudioBuffer
    try {
      audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    } finally {
      ctx.close()
    }

    const raw = audioBuffer.getChannelData(0)
    const total = raw.length
    const blockSize = Math.max(1, Math.floor(total / SAMPLES))
    const samples = new Float32Array(SAMPLES)

    for (let i = 0; i < SAMPLES; i++) {
      const start = i * blockSize
      const end = Math.min(start + blockSize, total)
      let sum = 0
      for (let j = start; j < end; j++) {
        const v = raw[j]
        sum += v < 0 ? -v : v
      }
      samples[i] = sum / (end - start)
    }

    // Normalize 0–1
    let max = 0
    for (let i = 0; i < SAMPLES; i++) if (samples[i] > max) max = samples[i]
    if (max > 0) for (let i = 0; i < SAMPLES; i++) samples[i] /= max

    return { samples, duration: audioBuffer.duration }
  } catch {
    return null
  }
}
