import { Rect, Circle, RegularPolygon, Star, Line, Ellipse, Shape } from 'react-konva'
import type Konva from 'konva'
import type { ShapeElement } from '../../../types/editor'

interface Props {
  el: ShapeElement
  konvaProps: Record<string, unknown>
}

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

  if (el.shapeType.includes('-hand')) {
    switch (el.shapeType) {
      case 'rect-hand': {
        const tl = addWave(0, 0, 1), tr = addWave(w, 0, 2)
        const br = addWave(w, h, 3), bl = addWave(0, h, 4)
        return (
          <Line {...shared} points={[tl[0],tl[1],tr[0],tr[1],br[0],br[1],bl[0],bl[1]]}
            closed lineCap="round" lineJoin="round" />
        )
      }
      case 'circle-hand': {
        const sides = 32
        const pts: number[] = []
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2
          const x = radius + Math.cos(angle) * radius
          const y = radius + Math.sin(angle) * radius
          const [wx, wy] = addWave(x, y, i)
          pts.push(wx - radius, wy - radius)
        }
        return <Line {...shared} points={pts} closed lineCap="round" lineJoin="round" />
      }
      case 'square-hand': {
        const s = Math.min(w, h)
        const tl = addWave(0, 0, 1), tr = addWave(s, 0, 2)
        const br = addWave(s, s, 3), bl = addWave(0, s, 4)
        return (
          <Line {...shared} points={[tl[0],tl[1],tr[0],tr[1],br[0],br[1],bl[0],bl[1]]}
            closed lineCap="round" lineJoin="round" />
        )
      }
    }
  }

  switch (el.shapeType) {
    case 'rect':
      return <Rect {...shared} width={w} height={h} cornerRadius={el.cornerRadius} />

    case 'circle':
      return <Circle {...shared} radius={radius} offsetX={-w / 2} offsetY={-h / 2} />

    case 'triangle':
      return <RegularPolygon {...shared} sides={3} radius={radius} offsetX={-w / 2} offsetY={-h / 2} />

    case 'star':
      return <Star {...shared} numPoints={5} innerRadius={radius * 0.4} outerRadius={radius}
        offsetX={-w / 2} offsetY={-h / 2} />

    case 'pentagon':
      return <RegularPolygon {...shared} sides={5} radius={radius} offsetX={-w / 2} offsetY={-h / 2} />

    case 'hexagon':
      return <RegularPolygon {...shared} sides={6} radius={radius} offsetX={-w / 2} offsetY={-h / 2} />

    case 'octagon':
      return <RegularPolygon {...shared} sides={8} radius={radius} offsetX={-w / 2} offsetY={-h / 2} />

    case 'diamond':
      return <Line {...shared} points={[w / 2, 0, w, h / 2, w / 2, h, 0, h / 2]} closed />

    case 'oval':
      return <Ellipse {...shared} radiusX={w / 2} radiusY={h / 2} offsetX={-w / 2} offsetY={-h / 2} />

    case 'cone':
      // Simple isosceles triangle — no offset needed for Line
      return <Line {...shared} points={[w / 2, 0, w, h, 0, h]} closed />

    case 'speechBubble': {
      // Rounded rectangle body + triangular tail drawn as a single canvas shape
      const r = Math.min(el.cornerRadius || 8, w * 0.15, h * 0.15)
      const bh = h * 0.78  // body height; remaining ~22% is the tail
      return (
        <Shape
          {...shared}
          width={w}
          height={h}
          sceneFunc={(ctx: Konva.Context, shape: Konva.Shape) => {
            ctx.beginPath()
            ctx.moveTo(r, 0)
            ctx.lineTo(w - r, 0)
            ctx.quadraticCurveTo(w, 0, w, r)
            ctx.lineTo(w, bh - r)
            ctx.quadraticCurveTo(w, bh, w - r, bh)
            // bottom-right → tail right base → tail tip → tail left base → bottom-left
            ctx.lineTo(w * 0.38, bh)
            ctx.lineTo(w * 0.22, h)     // tail tip
            ctx.lineTo(w * 0.14, bh)
            ctx.lineTo(r, bh)
            ctx.quadraticCurveTo(0, bh, 0, bh - r)
            ctx.lineTo(0, r)
            ctx.quadraticCurveTo(0, 0, r, 0)
            ctx.closePath()
            ctx.fillStrokeShape(shape)
          }}
        />
      )
    }

    case 'roundedSpeech': {
      // Oval bubble body + two thought-bubble dots, drawn as a single canvas shape
      const dotR1 = Math.max(w * 0.07, 4)
      const dotR2 = Math.max(w * 0.05, 3)
      return (
        <Shape
          {...shared}
          width={w}
          height={h}
          sceneFunc={(ctx: Konva.Context, shape: Konva.Shape) => {
            // Main ellipse (top ~80% of height)
            ctx.beginPath()
            ctx.ellipse(w / 2, h * 0.40, w / 2, h * 0.40, 0, 0, Math.PI * 2)
            ctx.closePath()
            ctx.fillStrokeShape(shape)
            // Dot 1
            ctx.beginPath()
            ctx.arc(w * 0.22, h * 0.76, dotR1, 0, Math.PI * 2)
            ctx.closePath()
            ctx.fillStrokeShape(shape)
            // Dot 2 (smaller, further down)
            ctx.beginPath()
            ctx.arc(w * 0.12, h * 0.92, dotR2, 0, Math.PI * 2)
            ctx.closePath()
            ctx.fillStrokeShape(shape)
          }}
        />
      )
    }

    default:
      return null
  }
}
