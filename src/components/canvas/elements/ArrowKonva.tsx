import { Arrow } from 'react-konva'
import type { ArrowElement } from '../../../types/editor'

interface Props {
  el: ArrowElement
  konvaProps: Record<string, unknown>
  pathProgress?: number
}

export default function ArrowKonva({ el, konvaProps, pathProgress = 1 }: Props) {
  const pointerAtBeginning = el.arrowHead === 'start' || el.arrowHead === 'both'
  const pointerAtEnd       = (el.arrowHead === 'end' || el.arrowHead === 'both') && pathProgress >= 1

  const dash = el.dotted
    ? [el.strokeWidth, el.strokeWidth * 2.5]
    : el.dashed
    ? [el.strokeWidth * 4, el.strokeWidth * 3]
    : undefined

  const points = (() => {
    const { x1, y1, x2, y2 } = el

    if (!el.curve) {
      // Straight arrow — interpolate endpoint by progress
      const ex = x1 + (x2 - x1) * pathProgress
      const ey = y1 + (y2 - y1) * pathProgress
      return [x1, y1, ex, ey]
    }

    // Curved arrow — compute full control point then partial De Casteljau
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1) return [x1, y1, x2, y2]
    const px = -dy / len, py = dx / len
    const mx = (x1 + x2) / 2 + px * el.curve
    const my = (y1 + y2) / 2 + py * el.curve

    if (pathProgress >= 1) return [x1, y1, mx, my, x2, y2]

    // Partial quadratic bezier up to t=pathProgress
    const t  = pathProgress
    const qx = x1 + (mx - x1) * t   // lerp(P0, P1, t)
    const qy = y1 + (my - y1) * t
    const ex = qx + (mx + (x2 - mx) * t - qx) * t   // B(t)
    const ey = qy + (my + (y2 - my) * t - qy) * t
    return [x1, y1, qx, qy, ex, ey]
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
