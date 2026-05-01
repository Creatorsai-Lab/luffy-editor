import { Image as KonvaImage, Rect, Group } from 'react-konva'
import useImage from 'use-image'
import type { ImageElement } from '../../../types/editor'

interface Props {
  el: ImageElement
  konvaProps: Record<string, unknown>
}

export default function ImageKonva({ el, konvaProps }: Props) {
  const [img] = useImage(el.src.startsWith('data:') ? el.src : `file://${el.src}`)

  if (!img) {
    return (
      <Group {...konvaProps}>
        <Rect width={el.width} height={el.height} fill="#1a1a2e" stroke="#2a2a2a" strokeWidth={1} cornerRadius={el.cornerRadius} />
      </Group>
    )
  }

  return (
    <KonvaImage
      {...konvaProps}
      image={img}
      width={el.width}
      height={el.height}
      cornerRadius={el.cornerRadius}
      perfectDrawEnabled={false}
    />
  )
}
