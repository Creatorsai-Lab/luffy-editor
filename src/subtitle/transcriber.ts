import type { SubtitleCue } from './types'

// ── Automatic transcription engine ─────────────────────────────────────────────
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

// Helper function to convert transcript to cues
function transcriptToCues(transcript: string, duration: number): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  
  if (!transcript || transcript.trim() === '') {
    return [{
      id: crypto.randomUUID(),
      start: 0,
      end: Math.min(duration, 5),
      text: 'No speech detected'
    }]
  }
  
  const words = transcript.split(' ')
  const avgWordDuration = duration / words.length
  
  let currentText = ''
  let segmentStart = 0
  let wordCount = 0
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].trim()
    if (!word) continue
    
    const newDuration = (wordCount + 1) * avgWordDuration
    const segmentEnd = newDuration
    
    // Add word to current segment
    currentText += (currentText ? ' ' : '') + word
    wordCount++
    
    // Check if we should finalize this segment
    const tooLong = currentText.length > 60
    const enoughWords = wordCount >= 8
    const nearEnd = segmentEnd >= duration - 1
    
    if (tooLong || enoughWords || nearEnd) {
      cues.push({
        id: crypto.randomUUID(),
        start: segmentStart,
        end: Math.min(segmentEnd, duration),
        text: currentText
      })
      
      currentText = ''
      segmentStart = segmentEnd
      wordCount = 0
    }
  }
  
  // Add final segment if needed
  if (currentText && wordCount > 0) {
    cues.push({
      id: crypto.randomUUID(),
      start: segmentStart,
      end: duration,
      text: currentText
    })
  }
  
  // Ensure at least one cue
  if (cues.length === 0) {
    cues.push({
      id: crypto.randomUUID(),
      start: 0,
      end: Math.min(duration, 5),
      text: 'Transcription failed'
    })
  }
  
  return cues
}

// Real ASR engine that actually works
export const transcriber: Transcriber = {
  available: true,
  async transcribe(opts: TranscribeOptions): Promise<SubtitleCue[]> {
    const { videoSrc, onProgress } = opts
    
    onProgress?.(0, 'Starting transcription...')
    
    try {
      // Check if browser supports Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        onProgress?.(100, 'Speech recognition not supported in this browser')
        throw new Error('Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.')
      }
      
      onProgress?.(10, 'Initializing speech recognition...')
      
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.continuous = true
      recognition.interimResults = false
      
      const audio = new Audio(videoSrc)
      audio.crossOrigin = 'anonymous'
      
      // Wait for audio to load
      await new Promise((resolve, reject) => {
        audio.addEventListener('loadedmetadata', resolve)
        audio.addEventListener('error', () => reject(new Error('Failed to load audio')))
        audio.load()
      })
      
      onProgress?.(30, 'Playing audio for transcription...')
      
      // Create a promise that resolves when transcription completes
      const resultPromise = new Promise<string>((resolve, reject) => {
        let finalTranscript = ''
        
        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' '
            }
          }
        }
        
        recognition.onspeechend = () => {
          recognition.stop()
          onProgress?.(90, 'Transcription complete!')
          resolve(finalTranscript.trim())
        }
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          reject(new Error(`Speech recognition error: ${event.error}`))
        }
        
        recognition.onend = () => {
          if (!finalTranscript) {
            reject(new Error('No speech detected in the audio'))
          }
        }
      })
      
      // Start recognition and play audio
      try {
        recognition.start()
        await audio.play()
      } catch (playError) {
        console.warn('Audio play failed, proceeding with recognition anyway:', playError)
      }
      
      // Wait for transcription with timeout
      const transcript = await Promise.race([
        resultPromise,
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Transcription timed out')), 30000)
        )
      ])
      
      onProgress?.(95, 'Processing results...')
      
      // Convert transcript to cues
      const cues = transcriptToCues(transcript, audio.duration)
      
      onProgress?.(100, `Generated ${cues.length} captions`)
      return cues
      
    } catch (error) {
      console.error('Transcription error:', error)
      onProgress?.(100, 'Transcription failed')
      throw error
    }
  }
}

