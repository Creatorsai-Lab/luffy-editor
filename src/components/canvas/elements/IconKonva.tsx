import { useEffect, useRef, useState } from 'react'
import { Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import type { IconElement, SlideDir } from '../../../types/editor'
import { buildIconSvg, svgToDataUrl } from '../../../engine/iconData'

interface Props {
  el: IconElement
  konvaProps: Record<string, unknown>
  textProgress?: number
  wipeProgress?: number
  wipeDir?: SlideDir
}

const imageCache = new Map<string, HTMLImageElement>()

function loadIconImage(iconName: string, color: string, strokeWidth: number): Promise<HTMLImageElement> {
  const key = `${iconName}:${color}:${strokeWidth}`
  if (imageCache.has(key)) return Promise.resolve(imageCache.get(key)!)

  return new Promise(resolve => {
    const svg = buildIconSvg(iconName, color, strokeWidth, 64)
    if (!svg) { resolve(new Image()); return }

    const img = new Image()
    img.onload = () => { imageCache.set(key, img); resolve(img) }
    img.onerror = () => resolve(new Image())
    img.src = svgToDataUrl(svg)
  })
}

export default function IconKonva({ el, konvaProps, textProgress = 1, wipeProgress = 1, wipeDir }: Props) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const nodeRef = useRef<Konva.Image | null>(null)

  useEffect(() => {
    loadIconImage(el.iconName, el.color, el.strokeWidth).then(img => {
      setImage(img)
      nodeRef.current?.getLayer()?.batchDraw()
    })
  }, [el.iconName, el.color, el.strokeWidth])

  const clipProps = (() => {
    if (wipeDir && wipeProgress < 1) {
      const clipX = wipeDir === 'left' ? el.width * (1 - wipeProgress) : 0
      const clipY = wipeDir === 'up'   ? el.height * (1 - wipeProgress) : 0
      const clipW = (wipeDir === 'left' || wipeDir === 'right') ? el.width * wipeProgress : el.width
      const clipH = (wipeDir === 'up'   || wipeDir === 'down')  ? el.height * wipeProgress : el.height
      return { clipX, clipY, clipWidth: Math.max(0, clipW), clipHeight: Math.max(0, clipH) }
    }
    return {}
  })()

  return (
    <KonvaImage
      ref={nodeRef}
      {...konvaProps}
      {...clipProps}
      image={image ?? undefined}
      width={el.width}
      height={el.height}
    />
  )
}
