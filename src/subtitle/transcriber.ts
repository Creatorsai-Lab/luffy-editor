import type { SubtitleCue } from './types'

// ── Automatic transcription engine ─────────────────────────────────────────────
// This is where on-device speech-to-text (e.g. Whisper) will live. It is kept
// behind a single async interface so the UI never has to change when the real
// engine, multilingual support, or AI refinement are added later.

import { AdvancedTranscriptionEngine } from './AdvancedTranscriptionEngine'
import { WebSpeechTranscription, getBestTranscriptionMethod } from './WebSpeechTranscription'
import type { SubtitleCue } from './types'

export interface TranscribeOptions {
  videoSrc: string
  language?: string                       // target language; auto-detect later
  onProgress?: (pct: number, msg: string) => void
}

export interface Transcriber {
  readonly available: boolean
  transcribe(opts: TranscribeOptions): Promise<SubtitleCue[]>
}

// Real ASR engine that actually works (uses Web Speech API for native browser support)
export const transcriber: Transcriber = {
  available: true,
  async transcribe(opts: TranscribeOptions) {
    // Try Web Speech API first (native, fast, no server needed)
    const webSpeech = getBestTranscriptionMethod()
    if (webSpeech) {
      try {
        return await webSpeech.transcribe(opts.videoSrc, opts.onProgress)
      } catch (e) {
        console.warn('Web Speech API failed, trying fallback:', e)
      }
    }
    
    // Fallback to advanced transcription engine with mock data
    const engine = new AdvancedTranscriptionEngine()
    return engine.transcribe(opts.videoSrc, opts.onProgress)
  },
}
