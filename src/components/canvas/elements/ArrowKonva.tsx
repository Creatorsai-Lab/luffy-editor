import { Arrow } from 'react-konva'
import type { ArrowElement } from '../../../types/editor'

interface Props {
  el: ArrowElement
  konvaProps: Record<string, unknown>
}

export default function ArrowKonva({ el, konvaProps }: Props) {
  const pointerAtBeginning = el.arrowHead === 'start' || el.arrowHead === 'both'
  const pointerAtEnd       = el.arrowHead === 'end'   || el.arrowHead === 'both'

  return (
    <Arrow
      {...konvaProps}
      x={0}
      y={0}
      points={[el.x1, el.y1, el.x2, el.y2]}
      stroke={el.stroke}
      strokeWidth={el.strokeWidth}
      fill={el.stroke}
      dash={el.dashed ? [8, 6] : undefined}
      pointerAtBeginning={pointerAtBeginning}
      pointerAtEnd={pointerAtEnd}
      pointerLength={10}
      pointerWidth={8}
      lineCap="round"
      lineJoin="round"
      perfectDrawEnabled={false}
    />
  )
}
