import { Layer, Line } from 'react-konva'
import { useCanvasStore } from '../../store/canvasStore'

interface Props {
  width: number
  height: number
}

export default function CanvasGrid({ width, height }: Props) {
  const { showGrid, gridSize, gridColor } = useCanvasStore()

  if (!showGrid) return null

  const lines: JSX.Element[] = []

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={gridColor}
        strokeWidth={1}
        listening={false}
      />
    )
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={gridColor}
        strokeWidth={1}
        listening={false}
      />
    )
  }

  return <>{lines}</>
}
