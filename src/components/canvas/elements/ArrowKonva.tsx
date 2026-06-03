import { Arrow, Line } from 'react-konva'
import type { ArrowElement } from '../../../types/editor'

interface Props {
  el: ArrowElement
  konvaProps: Record<string, unknown>
  pathProgress?: number
  dashOffset?: number
}

export default function ArrowKonva({ el, konvaProps, pathProgress = 1, dashOffset = 0 }: Props) {
  // Only hide end pointer when a drawPath animation is actively drawing the line
  const hasDrawAnim = el.animations.some(a => a.type === 'drawPath')
  const pointerAtBeginning = el.arrowHead === 'start' || el.arrowHead === 'both'
  const pointerAtEnd       = (el.arrowHead === 'end' || el.arrowHead === 'both') && (!hasDrawAnim || pathProgress >= 1)

  // flowLoop forces dashes even if the arrow wasn't manually set to dashed
  const hasFlow = dashOffset !== 0
  const dash = el.dotted
    ? [el.strokeWidth, el.strokeWidth * 2.5]
    : (el.dashed || hasFlow)
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

  const headColor = el.arrowHeadColor && el.arrowHeadColor !== '' ? el.arrowHeadColor : el.stroke
  // Points are absolute (x1..y2), so the node position must NOT add element.x/y again —
  // it carries only the animation offset (konvaProps.x already = element.x + anim delta).
  const animX = ((konvaProps.x as number) ?? 0) - el.x
  const animY = ((konvaProps.y as number) ?? 0) - el.y

  const commonProps = {
    ...konvaProps,
    x: animX,
    y: animY,
    points,
    stroke: el.stroke,
    strokeWidth: el.strokeWidth,
    dash,
    dashOffset,
    tension: el.curve ? 0.5 : 0,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    hitStrokeWidth: Math.max(16, (el.strokeWidth ?? 2) + 8),
    perfectDrawEnabled: false,
  }

  if (el.arrowHead === 'none') {
    return <Line key={`none-${el.id}`} {...commonProps} />
  }

  return (
    <Arrow
      {...commonProps}
      key={`${el.arrowHead}-${headColor}`}
      fill={headColor}
      pointerAtBeginning={pointerAtBeginning}
      pointerAtEnd={pointerAtEnd}
      pointerLength={el.pointerLength ?? 12}
      pointerWidth={el.pointerWidth ?? 10}
    />
  )
}
