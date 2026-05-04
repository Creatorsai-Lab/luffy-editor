import { useRef, useCallback, useEffect, useState } from 'react'
import { Plus, Play, Pause, SkipBack } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { cn } from '../../utils/cn'

const RULER_HEIGHT = 18
const SCENE_HEIGHT = 26
const TRACK_HEIGHT = 22
const PX_PER_SEC   = 60

const ANIM_COLORS: Record<string, string> = {
  fadeIn: '#6366f1', fadeOut: '#8b5cf6',
  slideIn: '#06b6d4', slideOut: '#0891b2',
  scaleIn: '#22c55e', scaleOut: '#16a34a',
  typewriter: '#f59e0b', spin: '#f97316', drawPath: '#ec4899',
  pulse: '#a78bfa', bounceLoop: '#34d399', rotateLoop: '#fb923c'
}

const TRANS_COLORS: Record<string, string> = {
  fade: '#6366f1', slide: '#06b6d4', push: '#0891b2',
  zoom: '#22c55e', wipe: '#f59e0b', morph: '#ec4899'
}

export default function Timeline() {
  const {
    project, currentSceneId,
    playhead, isPlaying,
    addScene, setCurrentScene, updateScene,
    setPlayhead, play, pause, stop,
    getTotalDuration
  } = useEditorStore()

  const [editDurId, setEditDurId] = useState<string | null>(null)

  const containerRef  = useRef<HTMLDivElement>(null)
  const rafRef        = useRef<number>(0)
  const lastTimeRef   = useRef<number>(0)

  // Playback RAF
  useEffect(() => {
    if (!isPlaying) { cancelAnimationFrame(rafRef.current); return }
    const totalDur = getTotalDuration()

    function tick(now: number) {
      if (!lastTimeRef.current) lastTimeRef.current = now
      const delta = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      useEditorStore.setState(s => {
        let next = s.playhead + delta
        if (next >= totalDur) next = 0
        s.playhead = next
        const at = useEditorStore.getState().getSceneAtTime(next)
        if (at && s.currentSceneId !== at.scene.id) s.currentSceneId = at.scene.id
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    lastTimeRef.current = 0
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying])

  const handleRulerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x    = e.clientX - rect.left + containerRef.current.scrollLeft
    const t    = x / PX_PER_SEC
    setPlayhead(Math.max(0, Math.min(getTotalDuration(), t)))
  }, [setPlayhead, getTotalDuration])

  if (!project) return (
    <div className="flex flex-col bg-orange flex-none" style={{ height: 120 }}>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-editor-border">
        <span className="text-xs text-editor-muted">Timeline</span>
      </div>
    </div>
  )

  const totalDur = getTotalDuration()
  const totalPx  = totalDur * PX_PER_SEC
  const currentSc = project.scenes.find(s => s.id === currentSceneId)

  const sceneStarts: Record<string, number> = {}
  let acc = 0
  for (const sc of project.scenes) {
    sceneStarts[sc.id] = acc
    acc += sc.duration
  }

  const playheadPx = playhead * PX_PER_SEC

  return (
    <div className="flex flex-col bg-[#171717] flex-none" style={{ height: 130 }}>
      {/* Controls row */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-editor-border flex-none">
        <button onClick={stop} className="text-editor-muted hover:text-editor-text transition-colors">
          <SkipBack size={12} />
        </button>
        <button
          onClick={() => isPlaying ? pause() : play()}
          className="flex items-center justify-center w-6 h-6 rounded bg-editor-accent hover:bg-editor-accent-hover text-white transition-colors"
        >
          {isPlaying ? <Pause size={10} /> : <Play size={10} />}
        </button>
        <span className="text-xs text-editor-muted tabular-nums ml-1">
          {fmtTime(playhead)} / {fmtTime(totalDur)}
        </span>
        <div className="flex-1" />
        <span className="text-2xs text-editor-muted">Double-click scene duration to edit</span>
        <button
          onClick={addScene}
          className="flex items-center gap-1 text-xs text-editor-accent hover:text-white px-2 py-1 rounded border border-editor-accent hover:bg-editor-accent transition-colors"
        >
          <Plus size={11} /> Scene
        </button>
      </div>

      {/* Scrollable track area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative cursor-pointer"
        onMouseDown={handleRulerClick}
      >
        <div className="relative" style={{ width: Math.max(totalPx + 120, 600), height: '100%' }}>
          {/* Time ruler */}
          <div className="absolute top-0 left-0 right-0" style={{ height: RULER_HEIGHT }}>
            {Array.from({ length: Math.ceil(totalDur) + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute flex flex-col items-start"
                style={{ left: i * PX_PER_SEC }}
              >
                <div className="w-px h-2 bg-editor-border-strong" />
                <span className="text-editor-muted" style={{ fontSize: 9 }}>{fmtTime(i)}</span>
              </div>
            ))}
          </div>

          {/* Scene blocks */}
          <div className="absolute left-0 right-0" style={{ top: RULER_HEIGHT, height: SCENE_HEIGHT }}>
            {project.scenes.map(sc => {
              const startPx = sceneStarts[sc.id] * PX_PER_SEC
              const widthPx = sc.duration * PX_PER_SEC
              const hasTrans = sc.transition && sc.transition.type !== 'none'
              const transColor = hasTrans ? (TRANS_COLORS[sc.transition.type] ?? '#6366f1') : null

              return (
                <div
                  key={sc.id}
                  onClick={e => { e.stopPropagation(); setCurrentScene(sc.id) }}
                  className={cn(
                    'absolute flex items-center px-2 cursor-pointer border-r border-editor-bg text-xs transition-colors select-none',
                    sc.id === currentSceneId
                      ? 'bg-editor-accent-dim text-editor-accent border-t-2 border-t-editor-accent'
                      : 'bg-editor-panel text-editor-secondary hover:bg-editor-hover'
                  )}
                  style={{ left: startPx, width: widthPx, height: SCENE_HEIGHT }}
                >
                  {/* Transition indicator stripe */}
                  {transColor && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-tl"
                      style={{ background: transColor }}
                    />
                  )}

                  <span className="truncate flex-1 pl-1">{sc.name}</span>

                  {/* Editable duration */}
                  {editDurId === sc.id ? (
                    <input
                      autoFocus
                      type="number"
                      defaultValue={sc.duration}
                      min={0.5} max={120} step={0.5}
                      className="w-12 bg-editor-bg border border-editor-accent rounded text-xs text-editor-text px-1 nodrag"
                      onBlur={e => {
                        updateScene(sc.id, { duration: Math.max(0.5, Number(e.target.value)) })
                        setEditDurId(null)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          updateScene(sc.id, { duration: Math.max(0.5, Number(e.currentTarget.value)) })
                          setEditDurId(null)
                        }
                        if (e.key === 'Escape') setEditDurId(null)
                        e.stopPropagation()
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="text-editor-muted flex-shrink-0 ml-1 cursor-text hover:text-editor-accent transition-colors"
                      onDoubleClick={e => { e.stopPropagation(); setEditDurId(sc.id) }}
                      title="Double-click to edit duration"
                    >
                      {sc.duration}s
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Element animation tracks */}
          {currentSc && currentSc.elements.map((el, ei) => {
            const scStart = sceneStarts[currentSc.id]
            return (
              <div
                key={el.id}
                className="absolute left-0 right-0 border-b border-editor-border"
                style={{ top: RULER_HEIGHT + SCENE_HEIGHT + ei * TRACK_HEIGHT, height: TRACK_HEIGHT }}
              >
                <div
                  className="absolute left-0 flex items-center px-2 text-xs text-editor-muted truncate"
                  style={{ width: 80, height: TRACK_HEIGHT, background: '#141414', zIndex: 1 }}
                >
                  {el.name}
                </div>
                {el.animations.map(anim => {
                  const barStart = (scStart + anim.startTime + anim.delay) * PX_PER_SEC
                  const barW     = anim.duration * PX_PER_SEC
                  const isLoop   = anim.type === 'pulse' || anim.type === 'bounceLoop' || anim.type === 'rotateLoop'
                  return (
                    <div
                      key={anim.id}
                      className="absolute rounded-sm text-white"
                      style={{
                        left: barStart + 80,
                        width: Math.max(barW, 4),
                        top: 3, height: TRACK_HEIGHT - 6,
                        background: ANIM_COLORS[anim.type] ?? '#6366f1',
                        fontSize: 9, paddingLeft: 2, lineHeight: `${TRACK_HEIGHT - 6}px`,
                        opacity: isLoop ? 0.85 : 1,
                        borderRight: isLoop ? '2px dashed rgba(255,255,255,0.4)' : undefined
                      }}
                      title={`${anim.type}${isLoop ? ' (loop)' : ''}`}
                    >
                      {barW > 30 ? anim.type : ''}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-10"
            style={{ left: playheadPx, width: 1, background: '#f59e0b' }}
          >
            <div className="w-2.5 h-2.5 bg-warning rounded-full -translate-x-[5px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1).padStart(4, '0')
  return `${m}:${sec}`
}
