import type { SubtitleCue } from './types'

// Format seconds → SRT timestamp "HH:MM:SS,mmm"
function srtTime(s: number): string {
  const ms = Math.round((s % 1) * 1000)
  const total = Math.floor(s)
  const hh = String(Math.floor(total / 3600)).padStart(2, '0')
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss},${String(ms).padStart(3, '0')}`
}

/** Serialize cues to an .srt string. */
export function cuesToSrt(cues: SubtitleCue[]): string {
  return cues
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text.trim()}\n`)
    .join('\n')
}

/** Format seconds → "M:SS.s" for the UI. */
export function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1).padStart(4, '0')
  return `${m}:${sec}`
}
