import { Rect, Circle, RegularPolygon, Star, Group, Line, Ellipse, Path } from 'react-konva'
import type { ShapeElement } from '../../../types/editor'

interface Props {
  el: ShapeElement
  konvaProps: Record<string, unknown>
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
