import { useEffect, useState } from 'react'
import { Shape, Rect, Group, Text } from 'react-konva'
import type { ImageElement, SlideDir } from '../../../types/editor'
import { toFileUrl } from '../../../utils/pathUtils'
import { drawPerspectiveWarp } from '../../../engine/perspectiveUtils'

interface Props {
  el: ImageElement
  konvaProps: Record<string, unknown>
  textProgress?: number
  wipeProgress?: number
  wipeDir?: SlideDir
}

export default function ImageKonva({ el, konvaProps, textProgress = 1, wipeProgress = 1, wipeDir }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [offscreen, setOffscreen] = useState<HTMLCanvasElement | null>(null)

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

  // Build offscreen canvas for perspective warp
  useEffect(() => {
    if (!el.perspectivePts || !img) return
    const canvas = document.createElement('canvas')
    canvas.width = el.width; canvas.height = el.height
    const ctx = canvas.getContext('2d')!
    ctx.save()
    if (el.cornerRadius > 0) {
      const r = el.cornerRadius, W = el.width, H = el.height
      ctx.beginPath(); ctx.moveTo(r, 0); ctx.arcTo(W,0,W,H,r); ctx.arcTo(W,H,0,H,r)
      ctx.arcTo(0,H,0,0,r); ctx.arcTo(0,0,W,0,r); ctx.closePath(); ctx.clip()
    }
    const parts: string[] = []
    if ((el.brightness ?? 100) !== 100) parts.push(`brightness(${(el.brightness??100)/100})`)
    if ((el.contrast   ?? 100) !== 100) parts.push(`contrast(${(el.contrast??100)/100})`)
    if ((el.saturation ?? 100) !== 100) parts.push(`saturate(${(el.saturation??100)/100})`)
    if ((el.hueRotate  ?? 0)   !== 0)   parts.push(`hue-rotate(${el.hueRotate??0}deg)`)
    if ((el.blur       ?? 0)   !== 0)   parts.push(`blur(${el.blur??0}px)`)
    if (el.glass) parts.push('blur(8px)')
    ctx.filter = parts.length ? parts.join(' ') : 'none'
    ctx.drawImage(img, 0, 0, el.width, el.height)
    if (el.glass) { ctx.filter = 'none'; ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0,0,el.width,el.height) }
    ctx.restore()
    setOffscreen(canvas)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, el.width, el.height, el.cornerRadius, el.brightness, el.contrast, el.saturation, el.hueRotate, el.blur, el.glass, !!el.perspectivePts])

  // Perspective warp rendering
  if (el.perspectivePts && offscreen) {
    return (
      <Shape
        {...konvaProps}
        width={el.width}
        height={el.height}
        hitFunc={(ctx, shape) => {
          ctx.beginPath(); ctx.rect(0, 0, el.width, el.height); ctx.closePath(); ctx.fillStrokeShape(shape)
        }}
        sceneFunc={(ctx, _shape) => {
          const raw = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          drawPerspectiveWarp(raw, offscreen, el.perspectivePts!, el.width, el.height)
        }}
      />
    )
  }

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

        // wipe reveal: directional clip
        if (wipeDir && wipeProgress < 1) {
          const clipX = wipeDir === 'left' ? el.width * (1 - wipeProgress) : 0
          const clipY = wipeDir === 'up'   ? el.height * (1 - wipeProgress) : 0
          const clipW = (wipeDir === 'left' || wipeDir === 'right') ? el.width * wipeProgress : el.width
          const clipH = (wipeDir === 'up'   || wipeDir === 'down')  ? el.height * wipeProgress : el.height
          raw.beginPath()
          raw.rect(clipX, clipY, Math.max(0, clipW), Math.max(0, clipH))
          raw.clip()
        }

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
