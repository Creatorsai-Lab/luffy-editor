import { Rect, Circle, RegularPolygon, Star, Group, Line, Ellipse, Path } from 'react-konva'
import type { ShapeElement } from '../../../types/editor'

interface Props {
  el: ShapeElement
  konvaProps: Record<string, unknown>
}

// Helper function to add waviness to a point for hand-drawn effect
function addWave(x: number, y: number, seed: number = 0): [number, number] {
  const wave = Math.sin((x + seed) * 0.05) * 2 + Math.sin((y + seed) * 0.03) * 1.5
  return [x + wave * (0.5 + (seed % 10) * 0.05), y + wave * (0.3 + (seed % 7) * 0.05)]
}

export default function ShapeKonva({ el, konvaProps }: Props) {
  const shared = {
    ...konvaProps,
    fill:        el.fill,
    stroke:      el.stroke,
    strokeWidth: el.strokeWidth,
    perfectDrawEnabled: false
  }

  const w = el.width
  const h = el.height
  const radius = Math.min(w, h) / 2
  const isHandDrawn = el.shapeType.includes('-hand')

  // Hand-drawn versions use slightly irregular paths
  if (isHandDrawn) {
    switch (el.shapeType) {
      case 'rect-hand': {
        // Rectangle with wavy edges
        const topLeft = addWave(0, 0, 1)
        const topRight = addWave(w, 0, 2)
        const bottomRight = addWave(w, h, 3)
        const bottomLeft = addWave(0, h, 4)
        return (
          <Line
            {...shared}
            points={[
              topLeft[0], topLeft[1],
              topRight[0], topRight[1],
              bottomRight[0], bottomRight[1],
              bottomLeft[0], bottomLeft[1]
            ]}
            closed
            lineCap="round"
            lineJoin="round"
          />
        )
      }
      case 'circle-hand': {
        // Circle with wavy edges - approximate with polygon
        const sides = 32
        const points: number[] = []
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2
          let x = radius + Math.cos(angle) * radius
          let y = radius + Math.sin(angle) * radius
          const waved = addWave(x, y, i)
          points.push(waved[0] - radius, waved[1] - radius)
        }
        return (
          <Line
            {...shared}
            points={points}
            closed
            lineCap="round"
            lineJoin="round"
          />
        )
      }
      case 'square-hand': {
        // Square (equal width/height) with wavy edges
        const size = Math.min(w, h)
        const topLeft = addWave(0, 0, 1)
        const topRight = addWave(size, 0, 2)
        const bottomRight = addWave(size, size, 3)
        const bottomLeft = addWave(0, size, 4)
        return (
          <Line
            {...shared}
            points={[
              topLeft[0], topLeft[1],
              topRight[0], topRight[1],
              bottomRight[0], bottomRight[1],
              bottomLeft[0], bottomLeft[1]
            ]}
            closed
            lineCap="round"
            lineJoin="round"
          />
        )
      }
    }
  }

  // Original sharp shapes
  switch (el.shapeType) {
    case 'rect':
      return <Rect {...shared} width={w} height={h} cornerRadius={el.cornerRadius} />
    
    case 'circle':
      return <Circle {...shared} radius={radius} offsetX={-w/2} offsetY={-h/2} />
    
    case 'triangle':
      return <RegularPolygon {...shared} sides={3} radius={radius} offsetX={-w/2} offsetY={-h/2} />
    
    case 'star':
      return <Star {...shared} numPoints={5} innerRadius={radius*0.4} outerRadius={radius} offsetX={-w/2} offsetY={-h/2} />
    
    case 'pentagon':
      return <RegularPolygon {...shared} sides={5} radius={radius} offsetX={-w/2} offsetY={-h/2} />
    
    case 'hexagon':
      return <RegularPolygon {...shared} sides={6} radius={radius} offsetX={-w/2} offsetY={-h/2} />
    
    case 'octagon':
      return <RegularPolygon {...shared} sides={8} radius={radius} offsetX={-w/2} offsetY={-h/2} />
    
    case 'diamond':
      return (
        <Line
          {...shared}
          points={[w/2, 0, w, h/2, w/2, h, 0, h/2]}
          closed
        />
      )
    
    case 'oval':
      return <Ellipse {...shared} radiusX={w/2} radiusY={h/2} offsetX={-w/2} offsetY={-h/2} />
    
    case 'speechBubble':
      // Rectangular speech bubble with tail
      return (
        <Group {...konvaProps}>
          <Rect
            fill={el.fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            width={w}
            height={h * 0.8}
            cornerRadius={el.cornerRadius}
          />
          <Line
            fill={el.fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            points={[w * 0.2, h * 0.8, w * 0.1, h, w * 0.3, h * 0.8]}
            closed
          />
        </Group>
      )
    
    case 'roundedSpeech':
      // Casual rounded speech bubble
      return (
        <Group {...konvaProps}>
          <Ellipse
            fill={el.fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            radiusX={w/2}
            radiusY={h * 0.4}
            offsetX={-w/2}
            offsetY={-h * 0.4}
          />
          <Circle
            fill={el.fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            radius={w * 0.08}
            x={w * 0.15}
            y={h * 0.7}
          />
          <Circle
            fill={el.fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            radius={w * 0.05}
            x={w * 0.08}
            y={h * 0.85}
          />
        </Group>
      )
    
    case 'cone':
      // Cone shape (triangle pointing up)
      return (
        <Line
          {...shared}
          points={[w/2, 0, w, h, 0, h]}
          closed
        />
      )
    
    default:
      return null
  }
}
