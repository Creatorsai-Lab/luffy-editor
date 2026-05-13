import { useEffect, useState } from 'react'
import { Image as KonvaImage, Rect, Group, Text } from 'react-konva'
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

    // Use toFileUrl utility for consistent path conversion
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
