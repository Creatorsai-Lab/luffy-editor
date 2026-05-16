import { useEffect, useRef, useState } from 'react'
import { Group, Rect, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import { useEditorStore } from '../../../store/editorStore'
import type { VideoElement } from '../../../types/editor'
import { toFileUrl } from '../../../utils/pathUtils'

interface Props {
  el: VideoElement
  konvaProps: Record<string, unknown>
}

export default function VideoKonva({ el, konvaProps }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const imageRef = useRef<Konva.Image | null>(null)
  const rafRef   = useRef<number>(0)
  const [loaded, setLoaded] = useState(false)

  const isPlaying = useEditorStore(s => s.isPlaying)

  // Create video element and load source
  useEffect(() => {
    const video = document.createElement('video')
    video.src         = toFileUrl(el.src)
    video.crossOrigin = 'anonymous'
    video.loop        = el.loop
    video.muted       = el.muted
    video.volume      = el.volume
    video.playbackRate= el.playbackRate
    video.preload     = 'auto'

    const onReady = () => { videoRef.current = video; setLoaded(true) }
    video.addEventListener('loadeddata', onReady)

    return () => {
      video.removeEventListener('loadeddata', onReady)
      video.pause()
      video.src = ''
      videoRef.current = null
      cancelAnimationFrame(rafRef.current)
      setLoaded(false)
    }
  }, [el.src])

  // Sync mutable video properties without reloading
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume        = el.volume
    v.playbackRate  = el.playbackRate
    v.loop          = el.loop
    v.muted         = el.muted
  }, [el.volume, el.playbackRate, el.loop, el.muted])

  // Play/pause + drive per-frame canvas redraw
  useEffect(() => {
    const v = videoRef.current
    if (!v || !loaded) return

    if (isPlaying) {
      v.play().catch(() => {})
      const tick = () => {
        imageRef.current?.getLayer()?.batchDraw()
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      v.pause()
      cancelAnimationFrame(rafRef.current)
      // Draw one final frame so the canvas shows current paused position
      imageRef.current?.getLayer()?.batchDraw()
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, loaded])

  return (
    <Group {...konvaProps}>
      {loaded && videoRef.current ? (
        <KonvaImage
          ref={imageRef}
          image={videoRef.current}
          width={el.width}
          height={el.height}
          cornerRadius={el.cornerRadius}
        />
      ) : (
        <Rect
          width={el.width}
          height={el.height}
          fill="#1a1a2e"
          cornerRadius={el.cornerRadius}
        />
      )}
    </Group>
  )
}
