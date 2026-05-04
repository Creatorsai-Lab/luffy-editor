import { Arrow } from 'react-konva'
import type { ArrowElement } from '../../../types/editor'

interface Props {
  el: ArrowElement
  konvaProps: Record<string, unknown>
}

export default function ArrowKonva({ el, konvaProps }: Props) {
  const pointerAtBeginning = el.arrowHead === 'start' || el.arrowHead === 'both'
  const pointerAtEnd       = el.arrowHead === 'end'   || el.arrowHead === 'both'

  const dash = el.dotted
    ? [el.strokeWidth, el.strokeWidth * 2.5]
    : el.dashed
    ? [el.strokeWidth * 4, el.strokeWidth * 3]
    : undefined

  const points = (() => {
    if (!el.curve) return [el.x1, el.y1, el.x2, el.y2]
    const dx = el.x2 - el.x1, dy = el.y2 - el.y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1) return [el.x1, el.y1, el.x2, el.y2]
    const px = -dy / len, py = dx / len
    const mx = (el.x1 + el.x2) / 2 + px * el.curve
    const my = (el.y1 + el.y2) / 2 + py * el.curve
    return [el.x1, el.y1, mx, my, el.x2, el.y2]
  })()

  return (
    <Arrow
      {...konvaProps}
      x={0}
      y={0}
      points={points}
      stroke={el.stroke}
      strokeWidth={el.strokeWidth}
      fill={el.arrowHeadColor || el.stroke}
      dash={dash}
      pointerAtBeginning={pointerAtBeginning}
      pointerAtEnd={pointerAtEnd}
      pointerLength={el.pointerLength ?? 12}
      pointerWidth={el.pointerWidth ?? 10}
      tension={el.curve ? 0.5 : 0}
      lineCap="round"
      lineJoin="round"
      hitStrokeWidth={Math.max(16, (el.strokeWidth ?? 2) + 8)}
      perfectDrawEnabled={false}
    />
  )
}
