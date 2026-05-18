import { useEffect, useRef, useState } from 'react'
import { Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import type { IconElement } from '../../../types/editor'
import { buildIconSvg, svgToDataUrl } from '../../../engine/iconData'

interface Props {
  el: IconElement
  konvaProps: Record<string, unknown>
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

export default function IconKonva({ el, konvaProps }: Props) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const nodeRef = useRef<Konva.Image | null>(null)

  useEffect(() => {
    loadIconImage(el.iconName, el.color, el.strokeWidth).then(img => {
      setImage(img)
      nodeRef.current?.getLayer()?.batchDraw()
    })
  }, [el.iconName, el.color, el.strokeWidth])

  return (
    <KonvaImage
      ref={nodeRef}
      {...konvaProps}
      image={image ?? undefined}
      width={el.width}
      height={el.height}
    />
  )
}
