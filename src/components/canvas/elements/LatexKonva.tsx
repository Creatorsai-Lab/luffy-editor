import { useEffect, useState } from 'react'
import { Image as KonvaImage, Rect, Text } from 'react-konva'
import type { LatexElement } from '../../../types/editor'
import { renderLatex, latexToDataUrl } from '../../../engine/latexRenderer'

interface Props {
  el: LatexElement
  konvaProps: Record<string, unknown>
}

export default function LatexKonva({ el, konvaProps }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    renderLatex(el.latex, el.color, el.fontSize).then(r => {
      if (cancelled) return
      if (!r) { setImg(null); setError(true); return }
      setError(false)
      const image = new window.Image()
      image.onload = () => { if (!cancelled) setImg(image) }
      image.onerror = () => { if (!cancelled) setError(true) }
      image.src = latexToDataUrl(r.svg)
    })
    return () => { cancelled = true }
  }, [el.latex, el.color, el.fontSize])

  if (error) {
    return (
      <Text {...konvaProps} width={el.width} height={el.height}
        text="LaTeX error" fontSize={16} fill="#ff6666" align="center" />
    )
  }

  if (!img) {
    // Transparent placeholder while the SVG rasterizes
    return <Rect {...konvaProps} width={el.width} height={el.height} fill="transparent" listening />
  }

  return (
    <KonvaImage
      {...konvaProps}
      image={img}
      width={el.width}
      height={el.height}
    />
  )
}
