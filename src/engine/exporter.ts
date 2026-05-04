import type { Project } from '../types/editor'
import type Konva from 'konva'

export interface ExportOptions {
  project:     Project
  getStage:    () => Konva.Stage | null
  onProgress:  (pct: number) => void
  onLog?:      (msg: string) => void
  renderFrame: (t: number) => Promise<void>
}

export async function exportToMP4(opts: ExportOptions): Promise<Blob> {
  const { project, getStage, onProgress, renderFrame: setFrame } = opts
  const fps    = project.fps
  const total  = project.scenes.reduce((s, sc) => s + sc.duration, 0)
  const frames = Math.ceil(total * fps)
  const w = project.width, h = project.height

  const offscreen   = document.createElement('canvas')
  offscreen.width   = w
  offscreen.height  = h
  const ctx         = offscreen.getContext('2d')!

  const stream     = offscreen.captureStream(0)
  const videoTrack = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack

  const mimeType = (
    ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find(m => MediaRecorder.isTypeSupported(m))
  ) ?? 'video/webm'

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: Math.min(10_000_000, w * h * fps * 0.1)
  })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
  const done = new Promise<void>(res => { recorder.onstop = () => res() })
  recorder.start(100)

  const msPerFrame = 1000 / fps

  for (let i = 0; i < frames; i++) {
    await setFrame(i / fps)
    await new Promise(r => requestAnimationFrame(r))

    const stage = getStage()
    if (stage) {
      const src = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.92, pixelRatio: 1 })
      const img = new Image()
      await new Promise<void>(res => { img.onload = () => res(); img.src = src })
      ctx.drawImage(img, 0, 0, w, h)
    }

    videoTrack.requestFrame()
    onProgress(Math.round((i / frames) * 90))
    await new Promise(r => setTimeout(r, msPerFrame))
  }

  recorder.stop()
  await done
  onProgress(100)

  return new Blob(chunks, { type: 'video/webm' })
}

export async function saveBlob(blob: Blob, savePath: string | null) {
  if (!savePath) return
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = savePath.split(/[\\/]/).pop() ?? 'export.webm'
  a.click()
  URL.revokeObjectURL(url)
}
