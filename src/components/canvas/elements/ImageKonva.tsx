import { useEffect, useState } from 'react'
import { Shape, Rect, Group, Text } from 'react-konva'
import type { ImageElement } from '../../../types/editor'
import { toFileUrl } from '../../../utils/pathUtils'

interface Props {
  el: ImageElement
  konvaProps: Record<string, unknown>
}

export default function ImageKonva({ el, konvaProps }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(false)

    const image = new window.Image()

    image.onload = () => {
      console.log('[ImageKonva] Image loaded successfully:', el.src)
      setImg(image)
      setError(false)
      setLoading(false)
    }

    image.onerror = (e) => {
      console.error('[ImageKonva] Failed to load image:', el.src, e)
      setError(true)
      setLoading(false)
    }

    const imageUrl = toFileUrl(el.src)
    image.src = imageUrl

    console.log('[ImageKonva] Loading image from:', imageUrl)

    return () => {
      image.onload = null
      image.onerror = null
    }
  }, [el.src])

  if (loading) {
    return (
      <Group {...konvaProps}>
        <Rect
          width={el.width}
          height={el.height}
          fill="#1a1a2e"
          stroke="#4a4a5a"
          strokeWidth={2}
          cornerRadius={el.cornerRadius}
          dash={[5, 5]}
        />
        <Text
          x={0}
          y={el.height / 2 - 10}
          width={el.width}
          text="Loading..."
          fontSize={14}
          fill="#888"
          align="center"
        />
      </Group>
    )
  }

  if (error || !img) {
    return (
      <Group {...konvaProps}>
        <Rect
          width={el.width}
          height={el.height}
          fill="#2a1a1a"
          stroke="#aa4444"
          strokeWidth={2}
          cornerRadius={el.cornerRadius}
        />
        <Text
          x={0}
          y={el.height / 2 - 10}
          width={el.width}
          text="Image Error"
          fontSize={14}
          fill="#ff6666"
          align="center"
        />
      </Group>
    )
  }

  return (
    <Shape
      {...konvaProps}
      width={el.width}
      height={el.height}
      hitFunc={(ctx, shape) => {
        ctx.beginPath()
        ctx.rect(0, 0, el.width, el.height)
        ctx.closePath()
        ctx.fillStrokeShape(shape)
      }}
      sceneFunc={(ctx, shape) => {
        const raw = (ctx as unknown as { _context: CanvasRenderingContext2D })._context

        raw.save()

        // Clip to rounded rect if needed
        if (el.cornerRadius > 0) {
          const r = el.cornerRadius
          const w = el.width
          const h = el.height
          raw.beginPath()
          raw.moveTo(r, 0)
          raw.arcTo(w, 0, w, h, r)
          raw.arcTo(w, h, 0, h, r)
          raw.arcTo(0, h, 0, 0, r)
          raw.arcTo(0, 0, w, 0, r)
          raw.closePath()
          raw.clip()
        }

        // Build CSS filter string
        const parts: string[] = []
        const brightness = el.brightness ?? 100
        const contrast   = el.contrast   ?? 100
        const saturation = el.saturation ?? 100
        const hueRotate  = el.hueRotate  ?? 0
        const blur       = el.blur       ?? 0

        if (brightness !== 100) parts.push(`brightness(${brightness / 100})`)
        if (contrast   !== 100) parts.push(`contrast(${contrast / 100})`)
        if (saturation !== 100) parts.push(`saturate(${saturation / 100})`)
        if (hueRotate  !== 0)   parts.push(`hue-rotate(${hueRotate}deg)`)
        if (blur       !== 0)   parts.push(`blur(${blur}px)`)
        if (el.glass)           parts.push('blur(8px)')

        raw.filter = parts.length > 0 ? parts.join(' ') : 'none'

        raw.drawImage(img, 0, 0, el.width, el.height)

        if (el.glass) {
          raw.filter = 'none'
          raw.fillStyle = 'rgba(255,255,255,0.18)'
          raw.fillRect(0, 0, el.width, el.height)
        }

        raw.restore()

        ctx.fillStrokeShape(shape)
      }}
    />
  )
}
