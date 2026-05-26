import React from 'react'
import { Rect, Circle, RegularPolygon, Star, Line, Ellipse, Shape, Group } from 'react-konva'
import type Konva from 'konva'
import type { ShapeElement, SlideDir } from '../../../types/editor'

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexChannel(hex: string, idx: number): number {
  return parseInt(hex.slice(idx, idx + 2), 16)
}

function adjustHex(color: string, pct: number): string {
  const m = color.match(/^#([0-9a-f]{3,6})$/i)
  if (!m) return color
  const s = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1]
  const adj = (i: number) => {
    const v = hexChannel(s, i)
    const out = pct > 0
      ? Math.round(v + (255 - v) * pct)
      : Math.round(v * (1 + pct))
    return Math.max(0, Math.min(255, out)).toString(16).padStart(2, '0')
  }
  return `#${adj(0)}${adj(2)}${adj(4)}`
}

function topFaceColor(fill: string, faceColor?: string): string {
  return faceColor || adjustHex(fill, 0.35)
}

function sideFaceColor(fill: string, faceColor?: string): string {
  return faceColor ? adjustHex(faceColor, -0.25) : adjustHex(fill, -0.35)
}

interface Props {
  el: ShapeElement
  konvaProps: Record<string, unknown>
  wipeProgress?: number
  wipeDir?: SlideDir
}

function addWave(x: number, y: number, seed: number = 0): [number, number] {
  const wave = Math.sin((x + seed) * 0.05) * 2 + Math.sin((y + seed) * 0.03) * 1.5
  return [x + wave * (0.5 + (seed % 10) * 0.05), y + wave * (0.3 + (seed % 7) * 0.05)]
}

export default function ShapeKonva({ el, konvaProps, wipeProgress = 1, wipeDir }: Props) {
  const w = el.width
  const h = el.height
  const radius = Math.min(w, h) / 2

  const wipeActive = wipeProgress < 1 && wipeDir != null

  // When wipe is active, Group owns konvaProps; inner shapes use only visual props
  const shared = {
    ...(wipeActive ? {} : konvaProps),
    fill:        el.fill,
    stroke:      el.stroke,
    strokeWidth: el.strokeWidth,
    perfectDrawEnabled: false,
  }

  function wipe(node: React.ReactElement | null): React.ReactElement | null {
    if (!wipeActive || !node || !wipeDir) return node
    const clipX = wipeDir === 'left' ? w * (1 - wipeProgress) : 0
    const clipY = wipeDir === 'up'   ? h * (1 - wipeProgress) : 0
    const clipW = (wipeDir === 'left' || wipeDir === 'right') ? w * wipeProgress : w
    const clipH = (wipeDir === 'up'   || wipeDir === 'down')  ? h * wipeProgress : h
    return (
      <Group
        {...konvaProps}
        clipX={clipX}
        clipY={clipY}
        clipWidth={Math.max(0, clipW)}
        clipHeight={Math.max(0, clipH)}
      >
        {node}
      </Group>
    )
  }

  // 3D shapes need konvaProps on the Shape only when not in wipe mode
  const shapeKonvaProps = wipeActive ? {} : konvaProps

  if (el.shapeType.includes('-hand')) {
    switch (el.shapeType) {
      case 'rect-hand': {
        const tl = addWave(0, 0, 1), tr = addWave(w, 0, 2)
        const br = addWave(w, h, 3), bl = addWave(0, h, 4)
        return wipe(
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
        return wipe(<Line {...shared} points={pts} closed lineCap="round" lineJoin="round" />)
      }
      case 'square-hand': {
        const s = Math.min(w, h)
        const tl = addWave(0, 0, 1), tr = addWave(s, 0, 2)
        const br = addWave(s, s, 3), bl = addWave(0, s, 4)
        return wipe(
          <Line {...shared} points={[tl[0],tl[1],tr[0],tr[1],br[0],br[1],bl[0],bl[1]]}
            closed lineCap="round" lineJoin="round" />
        )
      }
    }
  }

  switch (el.shapeType) {
    case 'rect':
      return wipe(<Rect {...shared} width={w} height={h} cornerRadius={el.cornerRadius} />)

    case 'circle':
      return wipe(<Circle {...shared} radius={radius} offsetX={-w / 2} offsetY={-h / 2} />)

    case 'triangle':
      return wipe(<RegularPolygon {...shared} sides={3} radius={radius} offsetX={-w / 2} offsetY={-h / 2} />)

    case 'star':
      return wipe(<Star {...shared} numPoints={5} innerRadius={radius * 0.4} outerRadius={radius}
        offsetX={-w / 2} offsetY={-h / 2} />)

    case 'pentagon':
      return wipe(<RegularPolygon {...shared} sides={5} radius={radius} offsetX={-w / 2} offsetY={-h / 2} />)

    case 'hexagon':
      return wipe(<RegularPolygon {...shared} sides={6} radius={radius} offsetX={-w / 2} offsetY={-h / 2} />)

    case 'octagon':
      return wipe(<RegularPolygon {...shared} sides={8} radius={radius} offsetX={-w / 2} offsetY={-h / 2} />)

    case 'diamond':
      return wipe(<Line {...shared} points={[w / 2, 0, w, h / 2, w / 2, h, 0, h / 2]} closed />)

    case 'oval':
      return wipe(<Ellipse {...shared} radiusX={w / 2} radiusY={h / 2} offsetX={-w / 2} offsetY={-h / 2} />)

    case 'cone': {
      const baseRY  = Math.max(6, Math.min(h * 0.14, 28))
      const baseY   = h - baseRY
      const topColor  = topFaceColor(el.fill, el.faceColor)
      const darkColor = sideFaceColor(el.fill, el.faceColor)
      const sw = el.strokeWidth || 0
      const sk = el.stroke || 'transparent'
      return wipe(
        <Shape
          {...shapeKonvaProps}
          width={w} height={h}
          hitFunc={(ctx, shape) => {
            ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.closePath(); ctx.fillStrokeShape(shape)
          }}
          sceneFunc={(ctx, shape) => {
            const raw = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
            raw.save()

            raw.beginPath()
            raw.moveTo(w / 2, 0)
            raw.lineTo(0, baseY)
            raw.ellipse(w / 2, baseY, w / 2, baseRY, 0, Math.PI, 0, false)
            raw.closePath()
            raw.fillStyle = el.fill
            raw.fill()
            if (sw > 0) { raw.strokeStyle = sk; raw.lineWidth = sw; raw.stroke() }

            raw.beginPath()
            raw.ellipse(w / 2, baseY, w / 2, baseRY, 0, 0, Math.PI * 2)
            raw.fillStyle = topColor
            raw.fill()
            if (sw > 0) { raw.strokeStyle = sk; raw.lineWidth = sw; raw.stroke() }

            raw.beginPath()
            raw.ellipse(w / 2, baseY, w / 2, baseRY, 0, Math.PI, Math.PI * 2, false)
            raw.strokeStyle = darkColor
            raw.lineWidth = Math.max(1, sw)
            raw.setLineDash([4, 4])
            raw.stroke()
            raw.setLineDash([])

            raw.restore()
          }}
        />
      )
    }

    case 'cube': {
      const depth = el.depth ?? Math.min(w, h) * 0.38
      const ANGLE = Math.PI / 6
      const ox    = depth * Math.cos(ANGLE)
      const oy    = depth * Math.sin(ANGLE)
      const fw = w - ox
      const fh = h - oy
      const frontFill = el.fill
      const topFill   = topFaceColor(el.fill, el.faceColor)
      const rightFill = sideFaceColor(el.fill, el.faceColor)
      const sw = el.strokeWidth || 0
      const sk = el.stroke || 'transparent'

      return wipe(
        <Shape
          {...shapeKonvaProps}
          width={w} height={h}
          hitFunc={(ctx, shape) => {
            ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.closePath(); ctx.fillStrokeShape(shape)
          }}
          sceneFunc={(ctx, shape) => {
            const raw = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
            raw.save()

            const drawFace = (pts: number[], fill: string) => {
              raw.beginPath()
              raw.moveTo(pts[0], pts[1])
              for (let i = 2; i < pts.length; i += 2) raw.lineTo(pts[i], pts[i+1])
              raw.closePath()
              raw.fillStyle = fill
              raw.fill()
              if (sw > 0) { raw.strokeStyle = sk; raw.lineWidth = sw; raw.stroke() }
            }

            drawFace([0, oy, fw, oy, fw, h, 0, h], frontFill)
            drawFace([ox, 0, w, 0, fw, oy, 0, oy], topFill)
            drawFace([fw, oy, w, 0, w, fh, fw, h], rightFill)

            raw.restore()
          }}
        />
      )
    }

    case 'speechBubble': {
      const r = Math.min(el.cornerRadius || 8, w * 0.15, h * 0.15)
      const bh = h * 0.78
      return wipe(
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
            ctx.lineTo(w * 0.38, bh)
            ctx.lineTo(w * 0.22, h)
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
      const dotR1 = Math.max(w * 0.07, 4)
      const dotR2 = Math.max(w * 0.05, 3)
      return wipe(
        <Shape
          {...shared}
          width={w}
          height={h}
          sceneFunc={(ctx: Konva.Context, shape: Konva.Shape) => {
            ctx.beginPath()
            ctx.ellipse(w / 2, h * 0.40, w / 2, h * 0.40, 0, 0, Math.PI * 2)
            ctx.closePath()
            ctx.fillStrokeShape(shape)
            ctx.beginPath()
            ctx.arc(w * 0.22, h * 0.76, dotR1, 0, Math.PI * 2)
            ctx.closePath()
            ctx.fillStrokeShape(shape)
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
