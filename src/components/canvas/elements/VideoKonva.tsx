import { useEffect, useRef, useState } from 'react'
import { Group, Rect, Image as KonvaImage } from 'react-konva'
import type { VideoElement } from '../../../types/editor'
import { toFileUrl } from '../../../utils/pathUtils'

interface Props {
  el: VideoElement
  konvaProps: Record<string, unknown>
}

export default function VideoKonva({ el, konvaProps }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoImage, setVideoImage] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = document.createElement('video')
    video.src = toFileUrl(el.src)
    video.crossOrigin = 'anonymous'
    video.loop = el.loop
    video.muted = el.muted
    video.volume = el.volume
    video.playbackRate = el.playbackRate
    
    video.addEventListener('loadedmetadata', () => {
      setVideoImage(video)
    })

    videoRef.current = video

    return () => {
      video.pause()
      video.src = ''
      videoRef.current = null
    }
  }, [el.src, el.loop, el.muted, el.volume, el.playbackRate])

  // Update video properties when they change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = el.volume
      videoRef.current.playbackRate = el.playbackRate
      videoRef.current.loop = el.loop
      videoRef.current.muted = el.muted
    }
  }, [el.volume, el.playbackRate, el.loop, el.muted])

  return (
    <Group {...konvaProps}>
      {videoImage ? (
        <KonvaImage
          image={videoImage}
          width={el.width}
          height={el.height}
          cornerRadius={el.cornerRadius}
        />
      ) : (
        // Placeholder while video loads
        <Group>
          <Rect
            width={el.width}
            height={el.height}
            fill="#1a1a2e"
            cornerRadius={el.cornerRadius}
          />
          <Rect
            x={el.width / 2 - 30}
            y={el.height / 2 - 30}
            width={60}
            height={60}
            fill="#6366f1"
            cornerRadius={8}
          />
        </Group>
      )}
    </Group>
  )
}
