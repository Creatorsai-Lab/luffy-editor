import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import type { Project, Scene } from '../types/editor'
import { getAnimatedProps, drawAnimatedBg } from './animator'
import type Konva from 'konva'

const FFMPEG_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

let ffmpeg: FFmpeg | null = null

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg
  ffmpeg = new FFmpeg()
  await ffmpeg.load({
    coreURL: await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL: await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.wasm`, 'application/wasm')
  })
  return ffmpeg
}

// Renders one frame at absolute time `t` onto an off-screen canvas, returns data URL
function renderFrame(
  project: Project,
  t: number,
  stageCanvas: HTMLCanvasElement
): string {
  // We rely on the caller having already set the playhead and re-rendered Konva.
  // This function just captures what's currently on the Konva stage canvas.
  return stageCanvas.toDataURL('image/jpeg', 0.92)
}

export interface ExportOptions {
  project:     Project
  getStage:    () => Konva.Stage | null
  onProgress:  (pct: number) => void
  onLog?:      (msg: string) => void
  renderFrame: (t: number) => Promise<void>  // caller sets playhead + waits for render
}

export async function exportToMP4(opts: ExportOptions): Promise<Blob> {
  const { project, getStage, onProgress, renderFrame: setFrame } = opts

  const ff       = await getFFmpeg()
  const fps      = project.fps
  const total    = project.scenes.reduce((s, sc) => s + sc.duration, 0)
  const frames   = Math.ceil(total * fps)
  const w        = project.width
  const h        = project.height

  const offscreen = document.createElement('canvas')
  offscreen.width  = w
  offscreen.height = h
  const ctx = offscreen.getContext('2d')!

  for (let i = 0; i < frames; i++) {
    const t = i / fps
    await setFrame(t)

    // Give Konva a tick to repaint
    await new Promise(r => requestAnimationFrame(r))

    const stage = getStage()
    if (stage) {
      const src = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.92, pixelRatio: 1 })
      const img = new Image()
      await new Promise<void>(res => { img.onload = () => res(); img.src = src })
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
    }

    const dataURL = offscreen.toDataURL('image/jpeg', 0.92)
    const b64     = dataURL.split(',')[1]
    const bytes   = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    const fname   = `frame${String(i).padStart(6, '0')}.jpg`
    await ff.writeFile(fname, bytes)

    onProgress(Math.round((i / frames) * 90))
  }

  await ff.exec([
    '-framerate', String(fps),
    '-i', 'frame%06d.jpg',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '23',
    '-preset', 'fast',
    'output.mp4'
  ])

  onProgress(95)
  const data = await ff.readFile('output.mp4')
  onProgress(100)

  // Cleanup
  for (let i = 0; i < frames; i++) {
    await ff.deleteFile(`frame${String(i).padStart(6, '0')}.jpg`).catch(() => {})
  }
  await ff.deleteFile('output.mp4').catch(() => {})

  return new Blob([data], { type: 'video/mp4' })
}

export async function saveBlob(blob: Blob, savePath: string | null) {
  if (!savePath) return
  const buf  = await blob.arrayBuffer()
  const arr  = new Uint8Array(buf)
  // Write via IPC
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = savePath.split(/[\\/]/).pop() ?? 'export.mp4'
  a.click()
  URL.revokeObjectURL(url)
}
