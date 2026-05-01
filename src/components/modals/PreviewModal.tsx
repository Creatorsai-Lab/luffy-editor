import { useRef, useEffect, useCallback, useState } from 'react'
import { Stage, Layer, Shape } from 'react-konva'
import type Konva from 'konva'
import { X, Play, Pause, SkipBack } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { getAnimatedProps, drawAnimatedBg } from '../../engine/animator'
import CanvasElement from '../canvas/CanvasElement'
import type { Background } from '../../types/editor'

export default function PreviewModal() {
  const { project, setPreviewOpen } = useEditorStore()
  const [playhead, setPlayhead] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const rafRef  = useRef<number>(0)
  const lastRef = useRef<number>(0)

  const PREVIEW_W = 960
  const PREVIEW_H = project ? Math.round(960 * project.height / project.width) : 540
  const scale     = project ? PREVIEW_W / project.width : 1

  const totalDur  = project?.scenes.reduce((s, sc) => s + sc.duration, 0) ?? 0

  // Determine current scene at playhead
  function getSceneAt(t: number) {
    if (!project) return null
    let acc = 0
    for (const sc of project.scenes) {
      if (t < acc + sc.duration) return { scene: sc, localTime: t - acc }
      acc += sc.duration
    }
    return null
  }

  // RAF loop
  useEffect(() => {
    if (!isPlaying) { cancelAnimationFrame(rafRef.current); return }
    lastRef.current = 0
    const tick = (now: number) => {
      if (!lastRef.current) lastRef.current = now
      const delta = (now - lastRef.current) / 1000
      lastRef.current = now
      setPlayhead(t => {
        const next = t + delta
        return next >= totalDur ? 0 : next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, totalDur])

  if (!project) return null

  const at = getSceneAt(playhead)
  const scene = at?.scene ?? project.scenes[0]
  const localTime = at?.localTime ?? 0

  const sorted = [...scene.elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        {/* Stage */}
        <div className="border border-editor-border rounded overflow-hidden shadow-2xl">
          <Stage width={PREVIEW_W} height={PREVIEW_H} scaleX={scale} scaleY={scale}>
            <Layer>
              <BgShape bg={scene.background} w={project.width} h={project.height} time={playhead} />
            </Layer>
            <Layer>
              {sorted.filter(e => e.visible).map(el => (
                <CanvasElement
                  key={el.id}
                  element={el}
                  animProps={getAnimatedProps(el, localTime)}
                  isSelected={false}
                  onSelect={() => {}}
                  onDblClick={() => {}}
                  stageScale={scale}
                />
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 bg-editor-panel border border-editor-border rounded-lg px-4 py-2.5">
          <button onClick={() => { setPlayhead(0); setIsPlaying(false) }} className="text-editor-muted hover:text-editor-text">
            <SkipBack size={14} />
          </button>
          <button
            onClick={() => setIsPlaying(v => !v)}
            className="flex items-center justify-center w-8 h-8 rounded bg-editor-accent hover:bg-editor-accent-hover text-white transition-colors"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          {/* Progress */}
          <input
            type="range" min={0} max={totalDur} step={0.05}
            value={playhead}
            onChange={e => setPlayhead(Number(e.target.value))}
            className="w-48 accent-editor-accent"
          />
          <span className="text-xs text-editor-muted tabular-nums w-20">
            {playhead.toFixed(1)}s / {totalDur.toFixed(1)}s
          </span>

          <button
            onClick={() => setPreviewOpen(false)}
            className="text-editor-muted hover:text-editor-text transition-colors ml-2"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function BgShape({ bg, w, h, time }: { bg: Background; w: number; h: number; time: number }) {
  const sceneFunc = useCallback((ctx: Konva.Context) => {
    const raw = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
    if (bg.type === 'solid') {
      raw.fillStyle = bg.color; raw.fillRect(0, 0, w, h)
    } else if (bg.type === 'gradient') {
      const ang = (bg.angle * Math.PI) / 180
      const grd = raw.createLinearGradient(
        w/2 - Math.cos(ang)*w/2, h/2 - Math.sin(ang)*h/2,
        w/2 + Math.cos(ang)*w/2, h/2 + Math.sin(ang)*h/2
      )
      grd.addColorStop(0, bg.from); grd.addColorStop(1, bg.to)
      raw.fillStyle = grd; raw.fillRect(0, 0, w, h)
    } else if (bg.type === 'grid') {
      raw.fillStyle = bg.bgColor; raw.fillRect(0, 0, w, h)
      raw.strokeStyle = bg.lineColor; raw.lineWidth = 1
      for (let x = 0; x <= w; x += bg.cellSize) { raw.beginPath(); raw.moveTo(x,0); raw.lineTo(x,h); raw.stroke() }
      for (let y = 0; y <= h; y += bg.cellSize) { raw.beginPath(); raw.moveTo(0,y); raw.lineTo(w,y); raw.stroke() }
    } else if (bg.type === 'dots') {
      raw.fillStyle = bg.bgColor; raw.fillRect(0, 0, w, h)
      raw.fillStyle = bg.dotColor
      for (let x = bg.spacing/2; x < w; x += bg.spacing)
        for (let y = bg.spacing/2; y < h; y += bg.spacing)
          { raw.beginPath(); raw.arc(x,y,bg.radius,0,Math.PI*2); raw.fill() }
    } else if (bg.type === 'animated') {
      drawAnimatedBg(raw, time, w, h, bg.colors, bg.variant, bg.speed)
    }
  }, [bg, w, h, time])

  return <Shape width={w} height={h} sceneFunc={sceneFunc} listening={false} />
}
