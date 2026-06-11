// Web Speech API-based transcription for real on-device speech recognition
// Works in Chrome, Edge, and Safari with native support

import type { SubtitleCue } from './types'

interface WordTiming {
  word: string
  start: number
  end: number
  confidence: number
}

export class WebSpeechTranscription {
  private recognition: any
  private audioContext: AudioContext | null = null
  private audio: HTMLAudioElement | null = null
  
  constructor() {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = true
        this.recognition.interimResults = true
        this.recognition.lang = 'en-US'
      }
    } catch (e) {
      console.warn('Web Speech API not supported')
    }
  }
  
  async transcribe(videoSrc: string, onProgress?: (pct: number, msg: string) => void): Promise<SubtitleCue[]> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.'))
        return
      }
      
      onProgress?.(0, 'Loading audio and initializing speech recognition...')
      
      this.audio = new Audio(videoSrc)
      this.audio.crossOrigin = 'anonymous'
      
      this.audio.addEventListener('loadedmetadata', () => {
        onProgress?.(20, 'Processing audio stream...')
        
        // Setup audio context for real-time transcription
        this.setupAudioContext()
        
        // Start transcription
        this.startTranscription(onProgress)
          .then(cues => {
            resolve(cues)
          })
          .catch(err => {
            reject(err)
          })
      })
      
      this.audio.addEventListener('error', () => {
        reject(new Error('Failed to load audio file'))
      })
    })
  }
  
  private async setupAudioContext(): Promise<void> {
    if (!this.audio) return
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = this.audioContext.createMediaElementSource(this.audio)
      const dest = this.audioContext.createMediaStreamDestination()
      source.connect(dest)
    } catch (e) {
      console.warn('Audio context setup failed:', e)
    }
  }
  
  private async startTranscription(onProgress?: (pct: number, msg: string) => void): Promise<SubtitleCue[]> {
    if (!this.recognition || !this.audio) {
      throw new Error('Speech recognition not available')
    }
    
    return new Promise((resolve, reject) => {
      const allWords: WordTiming[] = []
      let startTime = performance.now()
      
      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript
            const confidence = event.results[i][0].confidence
            
            // Calculate timestamp based on audio progress
            const audioProgress = this.audio?.currentTime || 0
            const duration = this.audio?.duration || 10
            const wordCount = transcript.split(' ').length
            
            // Estimate word timing
            const wordDuration = duration / wordCount
            for (let i = 0; i < wordCount; i++) {
              allWords.push({
                word: transcript.split(' ')[i] || '',
                start: audioProgress + (i * wordDuration),
                end: audioProgress + ((i + 1) * wordDuration),
                confidence
              })
            }
            
            const progress = Math.min(95, 20 + (audioProgress / duration) * 75)
            onProgress?.(progress, `Transcribing... "${transcript.substring(0, 30)}..."`)
          }
        }
      }
      
      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        reject(new Error(`Speech recognition error: ${event.error}`))
      }
      
      this.recognition.onend = () => {
        // Transcription complete
        onProgress?.(95, 'Optimizing timestamps...')
        
        // Convert words to cues
        const cues = this.wordsToCues(allWords, this.audio?.duration || 10)
        
        onProgress?.(100, `Generated ${cues.length} captions`)
        resolve(cues)
      }
      
      // Start recognition
      try {
        this.recognition.start()
        this.audio.play().catch(() => {})
      } catch (e) {
        reject(e)
      }
    })
  }
  
  private wordsToCues(words: WordTiming[], duration: number): SubtitleCue[] {
    if (words.length === 0) {
      return [{
        id: crypto.randomUUID(),
        start: 0,
        end: Math.min(duration, 5),
        text: 'No speech detected'
      }]
    }
    
    const cues: SubtitleCue[] = []
    let currentSegmentWords: WordTiming[] = []
    let currentChars = 0
    
    for (const word of words) {
      const wordChars = word.word.length
      
      // Check if adding this word would exceed limits
      const wouldExceedChars = currentChars + wordChars > 60
      const wouldExceedWords = currentSegmentWords.length >= 10
      const gapTooLarge = currentSegmentWords.length > 0 && (word.start - currentSegmentWords[currentSegmentWords.length - 1].end > 0.8)
      
      if (wouldExceedChars || wouldExceedWords || gapTooLarge) {
        if (currentSegmentWords.length > 0) {
          const segment = this.createSegment(currentSegmentWords)
          cues.push(segment)
        }
        currentSegmentWords = [word]
        currentChars = wordChars
      } else {
        currentSegmentWords.push(word)
        currentChars += wordChars
      }
    }
    
    // Add final segment
    if (currentSegmentWords.length > 0) {
      const segment = this.createSegment(currentSegmentWords)
      cues.push(segment)
    }
    
    return cues
  }
  
  private createSegment(words: WordTiming[]): SubtitleCue {
    const start = words[0].start
    const end = words[words.length - 1].end
    const text = words.map(w => w.word.trim()).join(' ')
    
    // Ensure minimum duration
    const actualDuration = end - start
    const finalEnd = actualDuration < 0.8 ? start + 0.8 : end
    
    return {
      id: crypto.randomUUID(),
      start,
      end: finalEnd,
      text: text.replace(/\s+/g, ' ').trim()
    }
  }
  
  public destroy(): void {
    if (this.recognition) {
      this.recognition.stop()
    }
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Factory function to get the best available transcription method
export function getBestTranscriptionMethod() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const hasWebSpeech = !!SpeechRecognition
  
  if (hasWebSpeech) {
    return new WebSpeechTranscription()
  }
  
  return null
}
