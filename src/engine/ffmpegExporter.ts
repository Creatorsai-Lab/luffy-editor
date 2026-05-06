import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import type { Project } from '../types/editor'
import type Konva from 'konva'

export interface FFmpegExportOptions {
  project: Project
  getStage: () => Konva.Stage | null
  onProgress: (pct: number, message: string) => void
  onLog?: (msg: string) => void
  renderFrame: (t: number) => Promise<void>
  quality?: 'high' | 'ultra'
  format?: 'mp4' | 'webm'
}

let ffmpegInstance: FFmpeg | null = null
let ffmpegLoaded = false

async function loadFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) {
    return ffmpegInstance
  }

  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg()
    
    ffmpegInstance.on('log', ({ message }) => {
      onLog?.(message)
      console.log('[FFmpeg]', message)
    })
  }

  if (!ffmpegLoaded) {
    onLog?.('Loading FFmpeg...')
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    
    ffmpegLoaded = true
    onLog?.('FFmpeg loaded successfully')
  }

  return ffmpegInstance
}

export async function exportToMP4WithFFmpeg(opts: FFmpegExportOptions): Promise<Blob> {
  const { 
    project, 
    getStage, 
    onProgress, 
    onLog, 
    renderFrame, 
    quality = 'high',
    format = 'mp4'
  } = opts

  const fps = project.fps
  const totalDuration = project.scenes.reduce((s, sc) => s + sc.duration, 0)
  const totalFrames = Math.ceil(totalDuration * fps)
  const w = project.width
  const h = project.height

  onProgress(0, 'Initializing FFmpeg...')
  const ffmpeg = await loadFFmpeg(onLog)

  onProgress(5, 'Rendering frames...')
  
  // Create offscreen canvas for high-quality rendering
  const offscreen = document.createElement('canvas')
  offscreen.width = w
  offscreen.height = h
  const ctx = offscreen.getContext('2d', { 
    alpha: false,
    desynchronized: false,
    willReadFrequently: false
  })!

  // Render all frames to memory
  const frames: Uint8Array[] = []
  
  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps
    
    // Update playhead and render
    await renderFrame(time)
    await new Promise(r => requestAnimationFrame(r))
    
    const stage = getStage()
    if (stage) {
      // Get high-quality image from stage
      const dataUrl = stage.toDataURL({ 
        mimeType: 'image/png',
        quality: 1.0,
        pixelRatio: 1
      })
      
      // Load image and draw to canvas
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = dataUrl
      })
      
      ctx.drawImage(img, 0, 0, w, h)
      
      // Convert canvas to raw image data
      const imageData = ctx.getImageData(0, 0, w, h)
      const pngBlob = await new Promise<Blob>((resolve) => {
        offscreen.toBlob((blob) => resolve(blob!), 'image/png', 1.0)
      })
      
      const pngData = await pngBlob.arrayBuffer()
      frames.push(new Uint8Array(pngData))
    }
    
    const frameProgress = Math.round((i / totalFrames) * 70)
    onProgress(5 + frameProgress, `Rendering frame ${i + 1}/${totalFrames}`)
  }

  onProgress(75, 'Writing frames to FFmpeg...')
  
  // Write frames to FFmpeg virtual filesystem
  for (let i = 0; i < frames.length; i++) {
    const filename = `frame${String(i).padStart(6, '0')}.png`
    await ffmpeg.writeFile(filename, frames[i])
    
    if (i % 10 === 0) {
      const writeProgress = Math.round((i / frames.length) * 10)
      onProgress(75 + writeProgress, `Writing frame ${i + 1}/${frames.length}`)
    }
  }

  onProgress(85, 'Encoding video...')

  // Determine encoding settings based on quality
  const crf = quality === 'ultra' ? '18' : '23' // Lower = better quality
  const preset = quality === 'ultra' ? 'slow' : 'medium'
  const bitrate = quality === 'ultra' 
    ? Math.min(20_000_000, w * h * fps * 0.2)
    : Math.min(10_000_000, w * h * fps * 0.1)

  const outputFile = format === 'mp4' ? 'output.mp4' : 'output.webm'

  // Build FFmpeg command
  const ffmpegArgs = [
    '-framerate', String(fps),
    '-i', 'frame%06d.png',
    '-c:v', format === 'mp4' ? 'libx264' : 'libvpx-vp9',
    '-pix_fmt', 'yuv420p',
  ]

  if (format === 'mp4') {
    ffmpegArgs.push(
      '-crf', crf,
      '-preset', preset,
      '-movflags', '+faststart', // Enable streaming
      '-profile:v', 'high',
      '-level', '4.2'
    )
  } else {
    ffmpegArgs.push(
      '-b:v', String(bitrate),
      '-quality', 'good',
      '-cpu-used', quality === 'ultra' ? '0' : '2'
    )
  }

  ffmpegArgs.push(
    '-r', String(fps),
    '-t', String(totalDuration),
    outputFile
  )

  onLog?.(`FFmpeg command: ${ffmpegArgs.join(' ')}`)

  // Execute FFmpeg
  await ffmpeg.exec(ffmpegArgs)

  onProgress(95, 'Reading output file...')

  // Read the output file
  const data = await ffmpeg.readFile(outputFile)
  const blob = new Blob([data], { 
    type: format === 'mp4' ? 'video/mp4' : 'video/webm' 
  })

  onProgress(98, 'Cleaning up...')

  // Clean up virtual filesystem
  for (let i = 0; i < frames.length; i++) {
    const filename = `frame${String(i).padStart(6, '0')}.png`
    try {
      await ffmpeg.deleteFile(filename)
    } catch (e) {
      // Ignore errors
    }
  }

  try {
    await ffmpeg.deleteFile(outputFile)
  } catch (e) {
    // Ignore errors
  }

  onProgress(100, 'Export complete!')

  return blob
}

export async function isFFmpegAvailable(): Promise<boolean> {
  try {
    await loadFFmpeg()
    return true
  } catch (error) {
    console.error('FFmpeg not available:', error)
    return false
  }
}
