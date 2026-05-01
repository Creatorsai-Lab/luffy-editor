import { useRef } from 'react'
import { Text, Group } from 'react-konva'
import type Konva from 'konva'
import type { TextElement } from '../../../types/editor'

interface Props {
  el: TextElement
  konvaProps: Record<string, unknown>
  textProgress: number
}

const WEIGHT_MAP: Record<string, string> = {
  normal: 'normal', medium: '500', semibold: '600', bold: 'bold'
}

export default function TextKonva({ el, konvaProps, textProgress }: Props) {
  const content = textProgress < 1
    ? el.content.slice(0, Math.floor(el.content.length * textProgress))
    : el.content

  return (
    <Text
      {...konvaProps}
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
