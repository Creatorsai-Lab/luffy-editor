import { useEffect, useRef } from 'react'
import { Text } from 'react-konva'
import type Konva from 'konva'
import type { TextElement } from '../../../types/editor'
import { loadFont } from '../../../utils/fontLoader'

interface Props {
  el: TextElement
  konvaProps: Record<string, unknown>
  textProgress: number
}

const WEIGHT_MAP: Record<string, string> = {
  normal: 'normal', medium: '500', semibold: '600', bold: 'bold'
}

function resolveEffectProps(el: TextElement) {
  const effects = el.effects ?? []

  let shadowEnabled  = el.shadowBlur > 0
  let shadowColor    = el.shadowColor || 'rgba(0,0,0,0.5)'
  let shadowBlur     = el.shadowBlur
  let shadowOffsetX  = el.shadowOffsetX
  let shadowOffsetY  = el.shadowOffsetY
  let stroke         = el.textStroke || undefined
  let strokeWidth    = el.textStrokeWidth || 0
  let strokeEnabled  = !!(el.textStroke && el.textStrokeWidth > 0)
  let fillEnabled    = true

  if (effects.includes('shadow')) {
    shadowEnabled = true
    shadowColor   = 'rgba(0,0,0,0.75)'
    shadowBlur    = Math.max(shadowBlur, 15)
    shadowOffsetX = shadowOffsetX || 3
    shadowOffsetY = shadowOffsetY || 3
  }
  if (effects.includes('glow')) {
    shadowEnabled = true
    shadowColor   = el.color
    shadowBlur    = 22
    shadowOffsetX = 0
    shadowOffsetY = 0
  }
  if (effects.includes('outline')) {
    stroke        = stroke || '#000000'
    strokeWidth   = Math.max(strokeWidth, 2)
    strokeEnabled = true
  }
  if (effects.includes('hollow')) {
    fillEnabled   = false
    stroke        = stroke || el.color
    strokeWidth   = Math.max(strokeWidth, 2)
    strokeEnabled = true
  }

  return { shadowEnabled, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, stroke, strokeWidth, strokeEnabled, fillEnabled }
}

export default function TextKonva({ el, konvaProps, textProgress }: Props) {
  const nodeRef = useRef<Konva.Text | null>(null)

  // When the font family changes, ensure it's loaded then force-redraw the node
  useEffect(() => {
    const weight = el.fontWeight === 'bold' ? '700' : el.fontWeight === 'semibold' ? '600' : el.fontWeight === 'medium' ? '500' : '400'
    loadFont(el.fontFamily, weight).then(() => {
      nodeRef.current?.getLayer()?.batchDraw()
    }).catch(() => {})
  }, [el.fontFamily, el.fontWeight])

  const content = textProgress < 1
    ? el.content.slice(0, Math.floor(el.content.length * textProgress))
    : el.content

  const effectProps = resolveEffectProps(el)

  return (
    <Text
      ref={nodeRef}
      {...konvaProps}
      {...effectProps}
      text={content}
      width={el.width}
      fontSize={el.fontSize}
      fontFamily={el.fontFamily}
      fontStyle={[el.italic ? 'italic' : '', WEIGHT_MAP[el.fontWeight] ?? 'normal'].join(' ').trim()}
      textDecoration={el.underline ? 'underline' : ''}
      fill={el.color}
      align={el.align}
      lineHeight={el.lineHeight}
      letterSpacing={el.letterSpacing}
      wrap="word"
      perfectDrawEnabled={false}
    />
  )
}
