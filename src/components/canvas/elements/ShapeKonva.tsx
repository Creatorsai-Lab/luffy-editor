import { Rect, Circle, RegularPolygon, Star, Group } from 'react-konva'
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

  switch (el.shapeType) {
    case 'rect':
      return <Rect {...shared} width={el.width} height={el.height} cornerRadius={el.cornerRadius} />
    case 'circle':
      return <Circle {...shared} radius={Math.min(el.width, el.height) / 2} offsetX={-el.width/2} offsetY={-el.height/2} />
    case 'triangle':
      return <RegularPolygon {...shared} sides={3} radius={Math.min(el.width, el.height) / 2} offsetX={-el.width/2} offsetY={-el.height/2} />
    case 'star':
      return <Star {...shared} numPoints={5} innerRadius={Math.min(el.width,el.height)*0.2} outerRadius={Math.min(el.width,el.height)/2} offsetX={-el.width/2} offsetY={-el.height/2} />
    default:
      return null
  }
}
