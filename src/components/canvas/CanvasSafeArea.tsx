import { Rect } from 'react-konva'
import { useCanvasStore } from '../../store/canvasStore'

interface Props {
  width: number
  height: number
}

export default function CanvasSafeArea({ width, height }: Props) {
  const { showSafeArea, safeAreaMargin } = useCanvasStore()

  if (!showSafeArea) return null

  return (
    <Rect
      x={safeAreaMargin}
      y={safeAreaMargin}
      width={width - safeAreaMargin * 2}
      height={height - safeAreaMargin * 2}
      stroke="#10b981"
      strokeWidth={2}
      dash={[8, 4]}
      listening={false}
    />
  )
}
