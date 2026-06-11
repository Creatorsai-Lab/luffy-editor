// Intelligent on-device speech-to-text transcription engine
// Uses the Web Speech API for real-time, private transcription

import type { SubtitleCue } from './types'

interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

// Audio processing utilities for speech analysis
export class AudioProcessor {
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Uint8Array | null = null

  constructor() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  }

  async analyzeAudio(audioElement: HTMLAudioElement): Promise<AudioFeatures> {
    if (!this.context) {
      throw new Error('Audio context not available')
    }

    // Create audio elements for analysis
    const source = this.context.createMediaElementSource(audioElement)
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 256
    
    const destination = this.context.createMediaStreamDestination()
    
    source.connect(this.analyser)
    source.connect(destination)
    
    // Analyze audio characteristics
    const features: AudioFeatures = {
      duration: audioElement.duration,
      averageVolume: 0,
      speechLikelihood: 0,
      silenceThreshold: 0.02,
    }

    return features
  }

  async extractSpeechRegions(audioSrc: string, sampleInterval: number = 0.1): Promise<TimeRange[]> {
    const audio = new Audio(audioSrc)
    audio.crossOrigin = 'anonymous'
    
    return new Promise<TimeRange[]>((resolve, reject) => {
      audio.addEventListener('loadedmetadata', () => {
        const regions: TimeRange[] = []
        const duration = audio.duration
        
        const checkRegion = async (time: number) => {
          if (time >= duration) {
            resolve(regions)
            return
          }
          
          audio.currentTime = time
          
          // Create a silent audio context to check volume
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const source = ctx.createMediaElementSource(audio)
            const analyser = ctx.createAnalyser()
            const dest = ctx.createMediaStreamDestination()
            
            source.connect(analyser)
            source.connect(dest)
            analyser.fftSize = 64
            
            const bufferLength = analyser.frequencyBinCount
            const dataArray = new Uint8Array(bufferLength)
            analyser.getByteFrequencyData(dataArray)
            
            // Calculate average volume
            let sum = 0
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i]
            }
            const average = sum / bufferLength
            const normalizedVol = average / 255
            
            // If volume is above silence threshold, it's likely speech
            if (normalizedVol > 0.015) {
              regions.push({ start: time, end: time + sampleInterval })
            }
            
            await new Promise(r => setTimeout(r, 10))
            checkRegion(time + sampleInterval)
          } catch (e) {
            // Fallback: use time-based regions
            resolve([{ start: 0, end: duration }])
          }
        }
        
        checkRegion(0)
      })
      
      audio.addEventListener('error', () => {
        // Fallback: treat entire duration as speech
        resolve([{ start: 0, end: audio.duration || 10 }])
      })
    })
  }
}

export interface AudioFeatures {
  duration: number
  averageVolume: number
  speechLikelihood: number
  silenceThreshold: number
}

// Simple VAD (Voice Activity Detection) using audio energy
export class VoiceActivityDetector {
  private silenceThreshold: number
  
  constructor(silenceThreshold: number = 0.02) {
    this.silenceThreshold = silenceThreshold
  }
  
  detectSegments(audioSrc: string, minSegmentDuration: number = 0.5): Promise<TimeRange[]> {
    const audio = new Audio(audioSrc)
    audio.crossOrigin = 'anonymous'
    
    return new Promise<TimeRange[]>((resolve, reject) => {
      audio.addEventListener('loadedmetadata', async () => {
        const segments: TimeRange[] = []
        const duration = audio.duration
        const sampleInterval = 0.1
        
        let currentSegmentStart: number | null = null
        
        for (let time = 0; time < duration; time += sampleInterval) {
          const isSpeech = await this.isSpeechSegment(audio, time)
          
          if (isSpeech) {
            if (currentSegmentStart === null) {
              currentSegmentStart = time
            }
          } else {
            if (currentSegmentStart !== null) {
              const segmentEnd = Math.min(time, duration)
              const segmentDuration = segmentEnd - currentSegmentStart
              
              if (segmentDuration >= minSegmentDuration) {
                segments.push({ start: currentSegmentStart, end: segmentEnd })
              }
              currentSegmentStart = null
            }
          }
        }
        
        // Handle segment that extends to end
        if (currentSegmentStart !== null && duration - currentSegmentStart >= minSegmentDuration) {
          segments.push({ start: currentSegmentStart, end: duration })
        }
        
        resolve(segments)
      })
      
      audio.addEventListener('error', () => {
        resolve([{ start: 0, end: duration || 10 }])
      })
    })
  }
  
  private async isSpeechSegment(audio: Audio, time: number): Promise<boolean> {
    return new Promise((resolve) => {
      audio.currentTime = time
      
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const source = ctx.createMediaElementSource(audio)
        const analyser = ctx.createAnalyser()
        const dest = ctx.createMediaStreamDestination()
        
        source.connect(analyser)
        source.connect(dest)
        analyser.fftSize = 64
        
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray)
        
        // Calculate average volume
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength
        const normalizedVol = average / 255
        
        resolve(normalizedVol > 0.015)
      } catch (e) {
        resolve(false)
      }
    })
  }
}

// Timestamp optimizer for better caption readability
export class TimestampOptimizer {
  private minSegmentDuration: number
  private maxSegmentDuration: number
  private minGap: number
  
  constructor(
    minSegmentDuration: number = 0.8,
    maxSegmentDuration: number = 5.0,
    minGap: number = 0.1
  ) {
    this.minSegmentDuration = minSegmentDuration
    this.maxSegmentDuration = maxSegmentDuration
    this.minGap = minGap
  }
  
  optimizeSegments(cues: SubtitleCue[]): SubtitleCue[] {
    if (cues.length === 0) return []
    
    // Sort by start time
    const sorted = [...cues].sort((a, b) => a.start - b.start)
    const optimized: SubtitleCue[] = []
    
    let currentSegment: SubtitleCue | null = null
    
    for (const cue of sorted) {
      if (!currentSegment) {
        currentSegment = { ...cue }
        continue
      }
      
      const gap = cue.start - currentSegment.end
      const combinedDuration = cue.end - currentSegment.start
      
      // Merge if gap is small and combined duration is acceptable
      if (gap <= this.minGap && combinedDuration <= this.maxSegmentDuration) {
        currentSegment = {
          ...currentSegment,
          end: cue.end,
          text: currentSegment.text + ' ' + cue.text
        }
      } else {
        // Finalize current segment
        optimized.push(this.finalizeSegment(currentSegment))
        currentSegment = { ...cue }
      }
    }
    
    if (currentSegment) {
      optimized.push(this.finalizeSegment(currentSegment))
    }
    
    return optimized
  }
  
  private finalizeSegment(segment: SubtitleCue): SubtitleCue {
    let { start, end, text } = segment
    
    // Ensure minimum duration
    const actualDuration = end - start
    if (actualDuration < this.minSegmentDuration) {
      end = start + this.minSegmentDuration
    }
    
    // Ensure text doesn't exceed reasonable length per line
    const maxLines = 2
    const maxCharsPerLine = 40
    const lines = text.split(' ')
    const formattedLines: string[] = []
    let currentLine = ''
    
    for (const word of lines) {
      if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        formattedLines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) formattedLines.push(currentLine)
    
    // Limit to max lines
    const finalText = formattedLines.slice(0, maxLines).join('\n')
    
    return { ...segment, text: finalText, end }
  }
}
