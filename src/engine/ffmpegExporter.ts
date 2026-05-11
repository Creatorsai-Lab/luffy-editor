import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import type { Project } from '../types/editor'
import type Konva from 'konva'
import { renderTransition } from './transitionRenderer'

export interface FFmpegExportOptions {
  project: Project
  getStage: () => Konva.Stage | null
  onProgress: (pct: number, message: string) => void
  onLog?: (msg: string) => void
  renderFrame: (t: number) => Promise<void>
  /**
   * Optional: render a specific scene at a specific global time.
   * This is needed to export transitions correctly (we must render both from/to scenes).
   */
  renderSceneFrame?: (sceneId: string, globalTime: number) => Promise<void>
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

    // Try loading from local node_modules first (works offline),
    // then fall back to CDN if local files aren't available.
    const cdnBaseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

    try {
      // Attempt CDN load (most reliable for wasm cross-origin requirements)
      onLog?.('Fetching FFmpeg core from CDN...')
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`${cdnBaseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${cdnBaseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
    } catch (cdnError) {
      console.error('[FFmpeg] CDN load failed:', cdnError)
      onLog?.('CDN load failed, trying local fallback...')

      // Attempt local load as fallback
      try {
        await ffmpegInstance.load({
          coreURL: new URL('/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js', window.location.origin).href,
          wasmURL: new URL('/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm', window.location.origin).href,
        })
      } catch (localError) {
        console.error('[FFmpeg] Local load also failed:', localError)
        const msg = 'FFmpeg failed to load. Check your internet connection or ensure @ffmpeg/core is installed.'
        onLog?.(msg)
        throw new Error(msg)
      }
    }
    
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
    renderSceneFrame,
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
  
  // Composite canvas (also used for transition rendering).
  const composite = document.createElement('canvas')
  composite.width = w
  composite.height = h
  const compositeCtx = composite.getContext('2d', { 
    alpha: false,
    desynchronized: false,
    willReadFrequently: false
  })!

  // Build scene timeline with transition info
  interface SceneTimeInfo {
    sceneId: string
    sceneIndex: number
    startTime: number
    endTime: number
    transitionStart: number  // When transition to next scene starts
    transitionDuration: number
  }
  
  const sceneTimeline: SceneTimeInfo[] = []
  let elapsed = 0
  for (let i = 0; i < project.scenes.length; i++) {
    const scene = project.scenes[i]
    const hasNext = i < project.scenes.length - 1
    // Transition belongs to THIS scene (from this scene -> next scene).
    const transitionDuration = hasNext ? (scene.transition?.duration ?? 0) : 0
    
    sceneTimeline.push({
      sceneId: scene.id,
      sceneIndex: i,
      startTime: elapsed,
      endTime: elapsed + scene.duration,
      transitionStart: elapsed + scene.duration - transitionDuration,
      transitionDuration
    })
    
    elapsed += scene.duration
  }
  
  const fromCanvas = document.createElement('canvas')
  fromCanvas.width = w
  fromCanvas.height = h
  const fromCtx = fromCanvas.getContext('2d', { alpha: false })!

  const toCanvas = document.createElement('canvas')
  toCanvas.width = w
  toCanvas.height = h
  const toCtx = toCanvas.getContext('2d', { alpha: false })!

  async function captureStageInto(ctx: CanvasRenderingContext2D) {
    const stage = getStage()
    if (!stage) throw new Error('Stage not available during export')
    stage.batchDraw()
    await new Promise(r => requestAnimationFrame(r))
    const c = stage.toCanvas({ pixelRatio: 1 })
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(c, 0, 0, w, h)
  }

  async function canvasToJpegBytes(canvas: HTMLCanvasElement, q: number): Promise<Uint8Array> {
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(b => resolve(b!), 'image/jpeg', q)
    })
    return new Uint8Array(await blob.arrayBuffer())
  }

  const jpegQuality = quality === 'ultra' ? 0.96 : 0.92

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps
    
    // Find current scene and check if we're in a transition
    let currentSceneInfo: SceneTimeInfo | null = null
    let nextSceneInfo: SceneTimeInfo | null = null
    let transitionProgress = 0
    
    for (let j = 0; j < sceneTimeline.length; j++) {
      const info = sceneTimeline[j]
      if (time >= info.startTime && time < info.endTime) {
        currentSceneInfo = info
        
        // Check if we're in transition period
        if (time >= info.transitionStart && info.transitionDuration > 0) {
          nextSceneInfo = sceneTimeline[j + 1] ?? null
          transitionProgress = (time - info.transitionStart) / info.transitionDuration
        }
        break
      }
    }
    
    if (!currentSceneInfo) {
      // Shouldn't happen, but fallback to last scene
      currentSceneInfo = sceneTimeline[sceneTimeline.length - 1]
    }
    
    if (nextSceneInfo && currentSceneInfo.transitionDuration > 0) {
      if (!renderSceneFrame) {
        // Without scene-specific rendering, we can't reliably render both scenes.
        // Fallback: render only the current frame (no transition compositing).
        await renderFrame(time)
        await captureStageInto(compositeCtx)
      } else {
        const fromScene = project.scenes[currentSceneInfo.sceneIndex]
        const toScene = project.scenes[nextSceneInfo.sceneIndex]

        const delta = time - currentSceneInfo.transitionStart
        const progress = Math.max(0, Math.min(1, delta / currentSceneInfo.transitionDuration))

        // Render FROM scene at its natural global time.
        await renderSceneFrame(fromScene.id, time)
        await captureStageInto(fromCtx)

        // Render TO scene as if it starts at transitionStart (so its localTime begins at 0).
        const toGlobalTime = nextSceneInfo.startTime + delta
        await renderSceneFrame(toScene.id, toGlobalTime)
        await captureStageInto(toCtx)

        renderTransition({
          ctx: compositeCtx,
          width: w,
          height: h,
          progress,
          type: fromScene.transition.type,
          direction: fromScene.transition.direction,
          fromCanvas,
          toCanvas
        })
        transitionProgress = progress
      }
    } else {
      // Normal (non-transition) frame.
      await renderFrame(time)
      await captureStageInto(compositeCtx)
    }

    const filename = `frame${String(i).padStart(6, '0')}.jpg`
    const bytes = await canvasToJpegBytes(composite, jpegQuality)
    await ffmpeg.writeFile(filename, bytes)
    
    const frameProgress = Math.round((i / totalFrames) * 70)
    onProgress(5 + frameProgress, `Rendering frame ${i + 1}/${totalFrames} (${time.toFixed(2)}s${nextSceneInfo ? `, trans ${(transitionProgress * 100).toFixed(0)}%` : ''})`)
    
    // Log progress every 30 frames
    if (i % 30 === 0) {
      onLog?.(`Rendered frame ${i + 1}/${totalFrames} at time ${time.toFixed(2)}s`)
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
    '-i', 'frame%06d.jpg',
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

  // Read the output file (readFile returns FileData = Uint8Array | string; video is binary)
  const data = await ffmpeg.readFile(outputFile) as Uint8Array
  const blob = new Blob([data.buffer], { 
    type: format === 'mp4' ? 'video/mp4' : 'video/webm' 
  })

  onProgress(98, 'Cleaning up...')

  // Clean up virtual filesystem
  for (let i = 0; i < totalFrames; i++) {
    const filename = `frame${String(i).padStart(6, '0')}.jpg`
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
