import { useRef, useEffect, useCallback, useState } from 'react'
import { Stage, Layer, Rect, Shape, Group, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useEditorStore } from '../../store/editorStore'
import { getAnimatedProps, drawAnimatedBg } from '../../engine/animator'
import {
  makeText, makeShape, makeArrow, makeCode, makeTable, makeImage
} from '../../utils/defaults'
import type { Background, EditorElement } from '../../types/editor'
import CanvasElement from './CanvasElement'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 3

export default function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef     = useRef<Konva.Stage>(null)
  const trRef        = useRef<Konva.Transformer>(null)
  const animRef      = useRef<number>(0)
  const bgShapeRef   = useRef<Konva.Shape>(null)

  const [stageSize, setStageSize]   = useState({ w: 800, h: 450 })
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos]     = useState({ x: 0, y: 0 })
  const [drawingArrow, setDrawingArrow] = useState<{x1:number;y1:number;x2:number;y2:number}|null>(null)

  const {
    project, currentSceneId, selectedIds,
    playhead, isPlaying, activeTool, zoom,
    addElement, selectElement, deselectAll,
    setActiveTool, setStageRef, openCodeModal
  } = useEditorStore()

  const currentScene = project?.scenes.find(s => s.id === currentSceneId) ?? null

  // Register stage ref with store (for export)
  useEffect(() => {
    if (stageRef.current) setStageRef(stageRef as React.RefObject<unknown>)
  }, [stageRef.current])

  // Fit canvas to container
  useEffect(() => {
    if (!containerRef.current || !project) return
    const fit = () => {
      const cw = containerRef.current!.clientWidth  - 40
      const ch = containerRef.current!.clientHeight - 40
      const pw = project.width, ph = project.height
      const scale = Math.min(cw / pw, ch / ph)
      const sw = pw * scale, sh = ph * scale
      setStageSize({ w: sw, h: sh })
      setStageScale(scale)
      setStagePos({ x: (containerRef.current!.clientWidth - sw) / 2, y: (containerRef.current!.clientHeight - sh) / 2 })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [project?.width, project?.height])

  // Animated background rAF
  useEffect(() => {
    if (currentScene?.background.type !== 'animated') { cancelAnimationFrame(animRef.current); return }
    const draw = () => {
      bgShapeRef.current?.getLayer()?.batchDraw()
      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [currentScene?.background.type])

  // Sync transformer with selected nodes
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return
    const nodes = selectedIds
      .map(id => stageRef.current!.findOne(`#${id}`) as Konva.Node | null)
      .filter(Boolean) as Konva.Node[]
    trRef.current.nodes(nodes)
    trRef.current.getLayer()?.batchDraw()
  }, [selectedIds])

  // ── Coordinate helpers ─────────────────────────────────────────────────────

  function toCanvasCoords(clientX: number, clientY: number) {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const x = (clientX - rect.left - stagePos.x) / stageScale
    const y = (clientY - rect.top  - stagePos.y) / stageScale
    return { x, y }
  }

  // ── Canvas click → add element ─────────────────────────────────────────────

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const target = e.target
    // Clicked on empty canvas
    if (target === e.target.getStage() || target.name() === 'bg') {
      deselectAll()
    }

    if (!currentScene) return
    const { x, y } = toCanvasCoords(e.evt.clientX, e.evt.clientY)

    switch (activeTool) {
      case 'text': {
        addElement(makeText(x, y))
        setActiveTool('select')
        break
      }
      case 'shape-rect':     addElement(makeShape('rect',     x - 60, y - 60)); setActiveTool('select'); break
      case 'shape-circle':   addElement(makeShape('circle',   x - 60, y - 60)); setActiveTool('select'); break
      case 'shape-triangle': addElement(makeShape('triangle', x - 60, y - 60)); setActiveTool('select'); break
      case 'shape-star':     addElement(makeShape('star',     x - 60, y - 60)); setActiveTool('select'); break
      case 'code':           openCodeModal(); setActiveTool('select'); break
      case 'table':          addElement(makeTable(x - 180, y - 60)); setActiveTool('select'); break
    }
  }

  // ── Arrow drawing ──────────────────────────────────────────────────────────

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool !== 'arrow') return
    const { x, y } = toCanvasCoords(e.evt.clientX, e.evt.clientY)
    setDrawingArrow({ x1: x, y1: y, x2: x, y2: y })
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!drawingArrow || activeTool !== 'arrow') return
    const { x, y } = toCanvasCoords(e.evt.clientX, e.evt.clientY)
    setDrawingArrow(a => a ? { ...a, x2: x, y2: y } : null)
  }

  function handleMouseUp() {
    if (!drawingArrow || activeTool !== 'arrow') return
    const { x1, y1, x2, y2 } = drawingArrow
    if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
      addElement(makeArrow(x1, y1, x2, y2))
    }
    setDrawingArrow(null)
    setActiveTool('select')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!project || !currentScene) {
    return (
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-editor-bg">
        <p className="text-editor-muted text-sm">Create or open a project to start editing.</p>
      </div>
    )
  }

  const sortedEls = [...currentScene.elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-editor-bg"
      style={{ cursor: activeTool !== 'select' ? 'crosshair' : 'default' }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.w}
        height={stageSize.h}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ position: 'absolute' }}
      >
        {/* Background layer */}
        <Layer name="bg-layer">
          <BackgroundShape
            ref={bgShapeRef}
            bg={currentScene.background}
            w={project.width}
            h={project.height}
            time={playhead}
          />
        </Layer>

        {/* Elements layer */}
        <Layer name="elements-layer">
          {sortedEls.filter(el => el.visible).map(el => {
            // Compute scene-local time for animation
            let localTime = 0
            if (isPlaying || true) {
              let acc = 0
              for (const sc of project.scenes) {
                if (sc.id === currentSceneId) { localTime = playhead - acc; break }
                acc += sc.duration
              }
            }
            const animProps = isPlaying ? getAnimatedProps(el, localTime) : null

            return (
              <CanvasElement
                key={el.id}
                element={el}
                animProps={animProps}
                isSelected={selectedIds.includes(el.id)}
                onSelect={(multi) => {
                  if (!el.locked) selectElement(el.id, multi)
                }}
                onDblClick={() => {
                  if (el.type === 'code') openCodeModal(el.id)
                }}
                stageScale={stageScale}
              />
            )
          })}
        </Layer>

        {/* Selection / Transformer layer */}
        <Layer name="tr-layer">
          <Transformer
            ref={trRef}
            rotateEnabled
            enabledAnchors={['top-left','top-center','top-right','middle-right','bottom-right','bottom-center','bottom-left','middle-left']}
            boundBoxFunc={(old, box) => ({ ...box, width: Math.max(10, box.width), height: Math.max(10, box.height) })}
            anchorSize={7}
            anchorFill="#fff"
            anchorStroke="#6366f1"
            anchorStrokeWidth={1.5}
            borderStroke="#6366f1"
            borderStrokeWidth={1.5}
          />

          {/* Live arrow preview while drawing */}
          {drawingArrow && (
            <Shape
              sceneFunc={(ctx, shape) => {
                if (!drawingArrow) return
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

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 text-xs text-editor-muted bg-editor-surface px-2 py-1 rounded border border-editor-border">
        {Math.round(stageScale * 100)}%
      </div>
    </div>
  )
}

// ── Background rendering ───────────────────────────────────────────────────────

import React from 'react'

const BackgroundShape = React.forwardRef<Konva.Shape, {
  bg: Background; w: number; h: number; time: number
}>(function BackgroundShape({ bg, w, h, time }, ref) {
  const sceneFunc = useCallback((ctx: Konva.Context, shape: Konva.Shape) => {
    const raw = (ctx as unknown as { _context: CanvasRenderingContext2D })._context

    if (bg.type === 'solid') {
      ctx.fillStyle = bg.color
      ctx.fillRect(0, 0, w, h)
    } else if (bg.type === 'gradient') {
      const angle = (bg.angle * Math.PI) / 180
      const grd   = raw.createLinearGradient(
        w / 2 - Math.cos(angle) * w / 2, h / 2 - Math.sin(angle) * h / 2,
        w / 2 + Math.cos(angle) * w / 2, h / 2 + Math.sin(angle) * h / 2
      )
      grd.addColorStop(0, bg.from)
      grd.addColorStop(1, bg.to)
      raw.fillStyle = grd
      raw.fillRect(0, 0, w, h)
    } else if (bg.type === 'grid') {
      raw.fillStyle = bg.bgColor
      raw.fillRect(0, 0, w, h)
      raw.strokeStyle = bg.lineColor
      raw.lineWidth   = 1
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
      for (let x = bg.spacing / 2; x < w; x += bg.spacing) {
        for (let y = bg.spacing / 2; y < h; y += bg.spacing) {
          raw.beginPath(); raw.arc(x, y, bg.radius, 0, Math.PI * 2); raw.fill()
        }
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
