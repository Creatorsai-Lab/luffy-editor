// Subtitle module types. Kept separate so future multilingual + AI-refinement
// work can grow here without touching the rest of the editor.

export interface SubtitleCue {
  id: string
  start: number   // seconds
  end: number     // seconds
  text: string
}

export interface SubtitleTrack {
  id: string
  language: string        // BCP-47-ish, e.g. 'en'. Multilingual support comes later.
  label: string
  cues: SubtitleCue[]
  sourceVideoId?: string  // which video element these captions belong to
}

export function makeCue(start: number, end: number, text = ''): SubtitleCue {
  return { id: crypto.randomUUID(), start, end, text }
}
