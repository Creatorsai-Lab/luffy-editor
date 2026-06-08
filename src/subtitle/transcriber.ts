import type { SubtitleCue } from './types'

// ── Automatic transcription engine (placeholder) ─────────────────────────────
// This is where on-device speech-to-text (e.g. Whisper) will live. It is kept
// behind a single async interface so the UI never has to change when the real
// engine, multilingual support, or AI refinement are added later.

export interface TranscribeOptions {
  videoSrc: string
  language?: string                       // target language; auto-detect later
  onProgress?: (pct: number, msg: string) => void
}

export interface Transcriber {
  readonly available: boolean
  transcribe(opts: TranscribeOptions): Promise<SubtitleCue[]>
}

// Stub: real ASR not wired yet. Reports unavailable so the UI shows a clear
// "coming soon" state instead of pretending to work.
export const transcriber: Transcriber = {
  available: false,
  async transcribe() {
    throw new Error('Automatic transcription is not available yet — coming soon.')
  },
}
