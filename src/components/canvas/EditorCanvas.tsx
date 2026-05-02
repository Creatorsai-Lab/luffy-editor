import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Stage, Layer, Shape, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useEditorStore } from '../../store/editorStore'
import { getAnimatedProps, drawAnimatedBg } from '../../engine/animator'
import { registerStage } from '../../engine/stageRegistry'
import { makeText, makeShape, makeArrow, makeCode, makeTable } from '../../utils/defaults'
import type { Background } from '../../types/editor'
import CanvasElement from './CanvasElement'

export default function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef     = useRef<Konva.Stage | null>(null)
  const trRef        = useRef<Konva.Transformer | null>(null)
  const animFrameRef = useRef<number>(0)
  const bgShapeRef   = useRef<Konva.Shape | null>(null)

  // Computed display size (project coords → screen pixels)
  const [scale,    setScale]    = useState(1)
  const [canvasW,  setCanvasW]  = useState(800)
  const [canvasH,  setCanvasH]  = useState(450)
  const [offsetX,  setOffsetX]  = useState(0)
  const [offsetY,  setOffsetY]  = useState(0)

  const [drawingArrow, setDrawingArrow] = useState<{x1:number;y1:number;x2:number;y2:number}|null>(null)

  const {
    project, currentSceneId, selectedIds,
    playhead, isPlaying, activeTool,
    addElement, selectElement, deselectAll,
    removeElement, setActiveTool, openCodeModal
  } = useEditorStore()

  const currentScene = project?.scenes.find(s => s.id === currentSceneId) ?? null

  // ── Register stage in module registry (never stored in Zustand/Immer) ─────────
  useEffect(() => {
    registerStage(stageRef.current)
    return () => registerStage(null)
  })

  // ── Fit slide canvas to available space ────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !project) return
    const el = containerRef.current

    const recalc = () => {
      if (!containerRef.current) return
      const PAD   = 32
      const cw    = containerRef.current.clientWidth  - PAD * 2
      const ch    = containerRef.current.clientHeight - PAD * 2
      const pw    = project.width
      const ph    = project.height
      const s     = Math.min(cw / pw, ch / ph, 1)   // never upscale beyond 1:1
      const dw    = Math.round(pw * s)
      const dh    = Math.round(ph * s)
      const ox    = Math.round((containerRef.current.clientWidth  - dw) / 2)
      const oy    = Math.round((containerRef.current.clientHeight - dh) / 2)

      console.log(`[Canvas] project=${pw}×${ph}  container=${containerRef.current.clientWidth}×${containerRef.current.clientHeight}  scale=${s.toFixed(3)}  display=${dw}×${dh}  offset=(${ox},${oy})`)

      setScale(s)
      setCanvasW(dw)
      setCanvasH(dh)
      setOffsetX(ox)
      setOffsetY(oy)
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [project?.width, project?.height])

  // ── Animated background rAF ────────────────────────────────────────────────────
  useEffect(() => {
    if (currentScene?.background.type !== 'animated') {
      cancelAnimationFrame(animFrameRef.current)
      return
    }
    const tick = () => {
      bgShapeRef.current?.getLayer()?.batchDraw()
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [currentScene?.background.type])

  // ── Sync Transformer to selected nodes ────────────────────────────────────────
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return
    const nodes = selectedIds
      .map(id => stageRef.current!.findOne(`#${id}`) as Konva.Node | null)
      .filter((n): n is Konva.Node => n !== null)
    trRef.current.nodes(nodes)
    trRef.current.getLayer()?.batchDraw()
  }, [selectedIds])

  // ── Global keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedIds.forEach(id => removeElement(id))
      }
      if (e.key === 'Escape') {
        deselectAll()
        setActiveTool('select')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedIds, removeElement, deselectAll, setActiveTool])

  // ── Coordinate helper: client → project space ─────────────────────────────────
  // Uses the stage canvas DOM element's own bounding rect (handles CSS offset correctly)
  function toProjectCoords(clientX: number, clientY: number) {
    const dom = stageRef.current?.container()
    if (!dom) return { x: 0, y: 0 }
    const r = dom.getBoundingClientRect()
    return {
      x: (clientX - r.left) / scale,
      y: (clientY - r.top)  / scale
    }
  }

  // ── Stage event handlers ───────────────────────────────────────────────────────
  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target === e.target.getStage() || e.target.name() === 'bg') {
      deselectAll()
    }
    if (!currentScene) return
    const { x, y } = toProjectCoords(e.evt.clientX, e.evt.clientY)

    switch (activeTool) {
      case 'text':
        addElement(makeText(x, y))
        setActiveTool('select')
        break
      case 'shape-rect':
      case 'shape-circle':
      case 'shape-triangle':
      case 'shape-star': {
        const t = activeTool.replace('shape-', '') as 'rect' | 'circle' | 'triangle' | 'star'
        addElement(makeShape(t, x - 60, y - 60))
        setActiveTool('select')
        break
      }
      case 'code':
        openCodeModal()
        setActiveTool('select')
        break
      case 'table':
        addElement(makeTable(x - 180, y - 60))
        setActiveTool('select')
        break
    }
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool !== 'arrow') return
    const { x, y } = toProjectCoords(e.evt.clientX, e.evt.clientY)
    setDrawingArrow({ x1: x, y1: y, x2: x, y2: y })
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!drawingArrow) return
    const { x, y } = toProjectCoords(e.evt.clientX, e.evt.clientY)
    setDrawingArrow(a => a ? { ...a, x2: x, y2: y } : null)
  }

  function handleMouseUp() {
    if (!drawingArrow) return
    const { x1, y1, x2, y2 } = drawingArrow
    if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
      addElement(makeArrow(x1, y1, x2, y2))
    }
    setDrawingArrow(null)
    setActiveTool('select')
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  if (!project || !currentScene) {
    return (
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-5 h-5 border-2 border-editor-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Compute scene-local time for animations
  let localTime = 0
  {
    let acc = 0
    for (const sc of project.scenes) {
      if (sc.id === currentSceneId) { localTime = playhead - acc; break }
      acc += sc.duration
    }
  }

  const sortedEls = [...currentScene.elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden"
      style={{
        background: '#0a0a0a',
        cursor: activeTool !== 'select' ? 'crosshair' : 'default'
      }}
    >
      {/* Slide canvas — positioned by CSS, NOT by Konva x/y props */}
      <div
        style={{
          position: 'absolute',
          left: offsetX,
          top:  offsetY,
          width:  canvasW,
          height: canvasH,
          boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
          borderRadius: 2
        }}
      >
        <Stage
          ref={stageRef}
          width={canvasW}
          height={canvasH}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Background */}
          <Layer>
            <BackgroundShape
              ref={bgShapeRef}
              bg={currentScene.background}
              w={project.width}
              h={project.height}
              time={playhead}
            />
          </Layer>

          {/* Elements */}
          <Layer>
            {sortedEls.filter(el => el.visible).map(el => {
              const animProps = getAnimatedProps(el, localTime)
              return (
                <CanvasElement
                  key={el.id}
                  element={el}
                  animProps={isPlaying ? animProps : null}
                  isSelected={selectedIds.includes(el.id)}
                  onSelect={multi => { if (!el.locked) selectElement(el.id, multi) }}
                  onDblClick={() => { if (el.type === 'code') openCodeModal(el.id) }}
                  stageScale={scale}
                />
              )
            })}
          </Layer>

          {/* Transformer + arrow preview */}
          <Layer>
            <Transformer
              ref={trRef}
              rotateEnabled
              enabledAnchors={['top-left','top-center','top-right','middle-right','bottom-right','bottom-center','bottom-left','middle-left']}
              boundBoxFunc={(_old, box) => ({
                ...box,
                width:  Math.max(10, box.width),
                height: Math.max(10, box.height)
              })}
              anchorSize={7}
              anchorFill="#fff"
              anchorStroke="#6366f1"
              anchorStrokeWidth={1.5}
              borderStroke="#6366f1"
              borderStrokeWidth={1.5}
            />

            {drawingArrow && (
              <Shape
                sceneFunc={(ctx, shape) => {
                  const { x1, y1, x2, y2 } = drawingArrow
                  ctx.beginPath()
                  ctx.moveTo(x1, y1)
                  ctx.lineTo(x2, y2)
                  ctx.strokeShape(shape)
                }}
                stroke="#6366f1"
                strokeWidth={2}
                dash={[4, 4]}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-2 right-3 text-xs text-editor-muted bg-editor-surface/80 px-2 py-0.5 rounded border border-editor-border">
        {project.width}×{project.height} · {Math.round(scale * 100)}%
      </div>
    </div>
  )
}

// ── Background renderer ────────────────────────────────────────────────────────

const BackgroundShape = React.forwardRef<Konva.Shape, {
  bg: Background; w: number; h: number; time: number
}>(function BackgroundShape({ bg, w, h, time }, ref) {
  const sceneFunc = useCallback((ctx: Konva.Context, shape: Konva.Shape) => {
    const raw = (ctx as unknown as { _context: CanvasRenderingContext2D })._context

    if (bg.type === 'solid') {
      raw.fillStyle = bg.color
      raw.fillRect(0, 0, w, h)
    } else if (bg.type === 'gradient') {
      const angle = (bg.angle * Math.PI) / 180
      const cx = w / 2, cy = h / 2
      const dx = Math.cos(angle) * w / 2, dy = Math.sin(angle) * h / 2
      const grd = raw.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy)
      grd.addColorStop(0, bg.from)
      grd.addColorStop(1, bg.to)
      raw.fillStyle = grd
      raw.fillRect(0, 0, w, h)
    } else if (bg.type === 'grid') {
      raw.fillStyle = bg.bgColor
      raw.fillRect(0, 0, w, h)
      raw.strokeStyle = bg.lineColor
      raw.lineWidth = 1
      for (let x = 0; x <= w; x += bg.cellSize) {
        raw.beginPath(); raw.moveTo(x, 0); raw.lineTo(x, h); raw.stroke()
      }
      for (let y = 0; y <= h; y += bg.cellSize) {
        raw.beginPath(); raw.moveTo(0, y); raw.lineTo(w, y); raw.stroke()
      }
    } else if (bg.type === 'dots') {
      raw.fillStyle = bg.bgColor
      raw.fillRect(0, 0, w, h)
      raw.fillStyle = bg.dotColor
      for (let x = bg.spacing / 2; x < w; x += bg.spacing)
        for (let y = bg.spacing / 2; y < h; y += bg.spacing) {
          raw.beginPath(); raw.arc(x, y, bg.radius, 0, Math.PI * 2); raw.fill()
        }
    } else if (bg.type === 'animated') {
      drawAnimatedBg(raw, time, w, h, bg.colors, bg.variant, bg.speed)
    }

    ctx.fillStrokeShape(shape)
  }, [bg, w, h, time])

  return (
    <Shape
      ref={ref}
      name="bg"
      width={w}
      height={h}
      sceneFunc={sceneFunc}
      listening={false}
    />
  )
})
