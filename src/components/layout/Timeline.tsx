import { useRef, useCallback, useEffect, useState } from 'react'
import { Plus, Play, Pause, SkipBack, ZoomIn, ZoomOut, Magnet, Eye, EyeOff, ArrowRight, ArrowLeft, Activity, RotateCw, RefreshCw, ArrowUpDown, Music, Trash2, Copy } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { cn } from '../../utils/cn'
import Tooltip from '../ui/Tooltip'
import ContextMenu from '../ui/ContextMenu'
import type { AnimationType } from '../../types/editor'

const RULER_HEIGHT = 18
const SCENE_HEIGHT = 36
const TRACK_HEIGHT = 32
const PX_PER_SEC_BASE = 60

const SCENE_COLORS = ['#3b82f6', '#0ea5e9', '#6366f1', '#4169e1'] // blue, skyblue, indigo, royalblue

const ANIM_COLORS: Record<string, string> = {
  fadeIn: '#6366f1', fadeOut: '#8b5cf6',
  slideIn: '#06b6d4', slideOut: '#0891b2',
  scaleIn: '#22c55e', scaleOut: '#16a34a',
  typewriter: '#f59e0b', spin: '#f97316', drawPath: '#ec4899',
  pulse: '#a78bfa', bounceLoop: '#34d399', rotateLoop: '#fb923c'
}

const ANIM_ICONS: Record<AnimationType, React.ReactNode> = {
  fadeIn:          <Eye size={10} />,
  fadeOut:         <EyeOff size={10} />,
  slideIn:         <ArrowRight size={10} />,
  slideOut:        <ArrowLeft size={10} />,
  scaleIn:         <ZoomIn size={9} />,
  scaleOut:        <ZoomOut size={9} />,
  typewriter:      <span style={{ fontSize: 8 }}>Aa</span>,
  spin:            <RotateCw size={10} />,
  pulse:           <Activity size={10} />,
  bounceLoop:      <ArrowUpDown size={10} />,
  rotateLoop:      <RefreshCw size={10} />,
  drawPath:        <span style={{ fontSize: 8 }}>~</span>,
  typewriterChars: <span style={{ fontSize: 8 }}>A|</span>,
  typewriterWords: <span style={{ fontSize: 8 }}>W|</span>,
  textFade:        <Eye size={10} />,
  textBurst:       <span style={{ fontSize: 8 }}>✦</span>,
  textBounce:      <ArrowUpDown size={10} />,
  textBlock:       <span style={{ fontSize: 8 }}>▮</span>,
  textSquiz:       <span style={{ fontSize: 8 }}>↔</span>,
  textSpread:      <span style={{ fontSize: 8 }}>↔</span>,
  textTwirl:       <RotateCw size={10} />,
  textZoomIn:      <ZoomIn size={9} />,
  textZoomOut:     <ZoomOut size={9} />,
}

const TRANS_COLORS: Record<string, string> = {
  fade: '#6366f1', slide: '#06b6d4', push: '#0891b2',
  zoom: '#22c55e', wipe: '#f59e0b', morph: '#ec4899'
}

export default function Timeline() {
  const {
    project, currentSceneId,
    playhead, isPlaying,
    timelineZoom, snapEnabled,
    addScene, setCurrentScene, updateScene, reorderScenes, removeScene, duplicateScene,
    setPlayhead, play, pause, stop,
    getTotalDuration,
    setTimelineZoom, setSnapEnabled
  } = useEditorStore()

  const [editDurId, setEditDurId] = useState<string | null>(null)
  const [resizingScene, setResizingScene] = useState<{ id: string; edge: 'start' | 'end' } | null>(null)
  const [draggingPlayhead, setDraggingPlayhead] = useState(false)
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sceneId: string } | null>(null)

  const containerRef  = useRef<HTMLDivElement>(null)
  const rafRef        = useRef<number>(0)
  const lastTimeRef   = useRef<number>(0)

  const PX_PER_SEC = PX_PER_SEC_BASE * timelineZoom

  // Snap helper
  const snapTime = useCallback((time: number): number => {
    if (!snapEnabled) return time
    const gridSize = 0.1 // 100ms grid
    return Math.round(time / gridSize) * gridSize
  }, [snapEnabled])

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement) return
      if (e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case ' ':  // Space - Play/Pause
          e.preventDefault()
          isPlaying ? pause() : play()
          break

        case 'ArrowLeft':  // Previous frame
          if (!isPlaying) {
            e.preventDefault()
            setPlayhead(Math.max(0, playhead - 1/30))
          }
          break

        case 'ArrowRight':  // Next frame
          if (!isPlaying) {
            e.preventDefault()
            setPlayhead(Math.min(getTotalDuration(), playhead + 1/30))
          }
          break

        case 'Home':  // Jump to start
          e.preventDefault()
          setPlayhead(0)
          break

        case 'End':  // Jump to end
          e.preventDefault()
          setPlayhead(getTotalDuration())
          break

        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setTimelineZoom(Math.min(5, timelineZoom * 1.2))
          }
          break

        case '-':
        case '_':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setTimelineZoom(Math.max(0.1, timelineZoom / 1.2))
          }
          break

        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setTimelineZoom(1)
          }
          break

        case 'Delete':
        case 'Backspace': {
          // Only delete the scene when no canvas elements are selected.
          // If elements ARE selected, EditorCanvas handles the delete.
          const { selectedIds } = useEditorStore.getState()
          if (selectedIds.length === 0 && currentSceneId && project && project.scenes.length > 1) {
            e.preventDefault()
            removeScene(currentSceneId)
          }
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, playhead, timelineZoom, currentSceneId, project, pause, play, setPlayhead, getTotalDuration, setTimelineZoom, removeScene])

  const handleRulerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || draggingPlayhead) return
    const rect = containerRef.current.getBoundingClientRect()
    const x    = e.clientX - rect.left + containerRef.current.scrollLeft
    const t    = x / PX_PER_SEC
    setPlayhead(snapTime(Math.max(0, Math.min(getTotalDuration(), t))))
  }, [setPlayhead, getTotalDuration, PX_PER_SEC, snapTime, draggingPlayhead])

  // Playhead scrubbing
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingPlayhead(true)
    pause()

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + containerRef.current.scrollLeft
      const time = x / PX_PER_SEC
      setPlayhead(snapTime(Math.max(0, Math.min(getTotalDuration(), time))))
    }

    const handleMouseUp = () => {
      setDraggingPlayhead(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [pause, setPlayhead, getTotalDuration, PX_PER_SEC, snapTime])

  // Scene resize
  const handleSceneEdgeMouseDown = useCallback((sceneId: string, edge: 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation()
    setResizingScene({ id: sceneId, edge })

    const scene = project!.scenes.find(s => s.id === sceneId)!
    const startX = e.clientX
    const startDuration = scene.duration

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaTime = deltaX / PX_PER_SEC

      if (edge === 'end') {
        const newDuration = Math.max(0.5, startDuration + deltaTime)
        updateScene(sceneId, { duration: snapTime(newDuration) })
      } else {
        // Shrink from the left: dragging right shrinks duration, left extends it
        const newDuration = Math.max(0.5, startDuration - deltaTime)
        updateScene(sceneId, { duration: snapTime(newDuration) })
      }
    }

    const handleMouseUp = () => {
      setResizingScene(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [project, updateScene, PX_PER_SEC, snapTime])

  if (!project) return (
    <div className="flex flex-col bg-orange flex-none" style={{ height: 120 }}>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-editor-border">
        <span className="text-xs text-[#c1c1c1]">Timeline</span>
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
    <div className="flex flex-col bg-[#171717] flex-none" style={{ height: 160 }}>
      {/* Controls row */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-editor-border flex-none">
        <Tooltip text="Stop (Home)">
          <button onClick={stop} className="text-[#c1c1c1] hover:text-editor-text transition-colors">
            <SkipBack size={12} />
          </button>
        </Tooltip>
        
        <Tooltip text={isPlaying ? "Pause (Space)" : "Play (Space)"}>
          <button
            onClick={() => isPlaying ? pause() : play()}
            className="flex items-center justify-center w-6 h-6 rounded bg-editor-accent hover:bg-editor-accent-hover text-white transition-colors"
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          </button>
        </Tooltip>
        
        <span className="text-xs text-[#c1c1c1] tabular-nums ml-1">
          {fmtTime(playhead)} / {fmtTime(totalDur)}
        </span>

        <div className="w-px h-4 bg-editor-border mx-1" />

        {/* Zoom controls */}
        <Tooltip text="Zoom Out (Ctrl -)">
          <button 
            onClick={() => setTimelineZoom(Math.max(0.1, timelineZoom / 1.2))}
            className="text-[#c1c1c1] hover:text-editor-text transition-colors"
          >
            <ZoomOut size={12} />
          </button>
        </Tooltip>
        
        <span className="text-xs text-[#c1c1c1] tabular-nums min-w-[40px] text-center">
          {Math.round(timelineZoom * 100)}%
        </span>
        
        <Tooltip text="Zoom In (Ctrl +)">
          <button 
            onClick={() => setTimelineZoom(Math.min(5, timelineZoom * 1.2))}
            className="text-[#c1c1c1] hover:text-editor-text transition-colors"
          >
            <ZoomIn size={12} />
          </button>
        </Tooltip>

        <Tooltip text="Reset Zoom (Ctrl 0)">
          <button 
            onClick={() => setTimelineZoom(1)}
            className="text-xs text-[#c1c1c1] hover:text-editor-text transition-colors px-1"
          >
            1:1
          </button>
        </Tooltip>

        {/* Snap toggle */}
        <Tooltip text="Snap to Grid">
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
              snapEnabled 
                ? 'bg-editor-accent-dim text-editor-accent' 
                : 'text-[#c1c1c1] hover:text-editor-text'
            )}
          >
            <Magnet size={11} />
          </button>
        </Tooltip>

        <div className="flex-1" />
        
        <span className="text-2xs text-[#c1c1c1]">Drag scene edges • Drag playhead • Space to play</span>
        
        <Tooltip text="Add Scene">
          <button
            onClick={addScene}
            className="flex items-center gap-1 text-xs text-editor-accent hover:text-white px-2 py-1 rounded border border-editor-accent hover:bg-editor-accent transition-colors"
          >
            <Plus size={11} /> Scene
          </button>
        </Tooltip>
      </div>

      {/* Scrollable track area - now with vertical scroll support */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative cursor-pointer"
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
                <span className="text-[#c1c1c1]" style={{ fontSize: 9 }}>{fmtTime(i)}</span>
              </div>
            ))}
          </div>

          {/* Scene blocks */}
          <div className="absolute left-0 right-0" style={{ top: RULER_HEIGHT, height: SCENE_HEIGHT }}>
            {project.scenes.map((sc, index) => {
              const startPx = sceneStarts[sc.id] * PX_PER_SEC
              const widthPx = sc.duration * PX_PER_SEC
              const hasTrans = sc.transition && sc.transition.type !== 'none'
              const transColor = hasTrans ? (TRANS_COLORS[sc.transition.type] ?? '#6366f1') : null
              const isResizing = resizingScene?.id === sc.id
              const isDragging = draggedSceneIndex === index
              const isDropTarget = dropTargetIndex === index
              const sceneColor = SCENE_COLORS[index % SCENE_COLORS.length]
              const isActive = sc.id === currentSceneId

              return (
                <div
                  key={sc.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedSceneIndex(index)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => {
                    setDraggedSceneIndex(null)
                    setDropTargetIndex(null)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDropTargetIndex(index)
                  }}
                  onDragLeave={() => setDropTargetIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedSceneIndex !== null && draggedSceneIndex !== index) {
                      reorderScenes(draggedSceneIndex, index)
                    }
                    setDraggedSceneIndex(null)
                    setDropTargetIndex(null)
                  }}
                  onClick={e => { e.stopPropagation(); setCurrentScene(sc.id) }}
                  onContextMenu={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setContextMenu({ x: e.clientX, y: e.clientY, sceneId: sc.id })
                  }}
                  className={cn(
                    'absolute flex items-center px-3 cursor-pointer text-xs transition-all select-none rounded-md',
                    isDragging && 'opacity-50',
                    isDropTarget && 'ring-2 ring-editor-accent',
                    isResizing && 'ring-2 ring-white',
                    isActive && 'ring-2 ring-white shadow-lg'
                  )}
                  style={{ 
                    left: startPx, 
                    width: widthPx, 
                    height: SCENE_HEIGHT - 4,
                    top: 2,
                    background: sceneColor,
                    color: 'white',
                    fontWeight: isActive ? 600 : 400
                  }}
                >
                  {/* Transition indicator stripe */}
                  {transColor && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md"
                      style={{ background: transColor }}
                    />
                  )}

                  {/* Left resize handle */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 rounded-l-md z-10"
                    onMouseDown={(e) => handleSceneEdgeMouseDown(sc.id, 'start', e)}
                  />

                  <span className="truncate flex-1 pl-1 font-medium">{sc.name}</span>

                  {/* Editable duration */}
                  {editDurId === sc.id ? (
                    <input
                      autoFocus
                      type="number"
                      defaultValue={sc.duration}
                      min={0.5} max={120} step={0.5}
                      className="w-12 bg-white/20 border border-white/40 rounded text-xs text-white px-1 nodrag"
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
                      className="flex-shrink-0 ml-2 cursor-text hover:bg-white/20 px-1.5 py-0.5 rounded transition-colors"
                      onDoubleClick={e => { e.stopPropagation(); setEditDurId(sc.id) }}
                      title="Double-click to edit duration"
                    >
                      {sc.duration}s
                    </span>
                  )}

                  {/* Right resize handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 rounded-r-md z-10"
                    onMouseDown={(e) => handleSceneEdgeMouseDown(sc.id, 'end', e)}
                  />
                </div>
              )
            })}
          </div>

          {/* Audio tracks */}
          {currentSc && (
            <div className="absolute left-0 right-0" style={{ top: RULER_HEIGHT + SCENE_HEIGHT, height: 'auto' }}>
              {currentSc.elements
                .filter(el => el.type === 'audio')
                .map((audioEl, audioIdx) => {
                  const scStart = sceneStarts[currentSc.id]
                  const audioStartPx = (scStart + audioEl.x) * PX_PER_SEC
                  const audioWidthPx = audioEl.duration * PX_PER_SEC
                  const fileName = audioEl.name.substring(0, 10)
                  
                  return (
                    <div
                      key={audioEl.id}
                      className="relative border-b border-editor-border/50 group"
                      style={{ height: TRACK_HEIGHT }}
                    >
                      {/* Audio bar with waveform effect */}
                      <div
                        className="absolute rounded cursor-move hover:ring-2 hover:ring-editor-accent group/bar transition-all overflow-hidden"
                        style={{
                          left: audioStartPx,
                          width: Math.max(audioWidthPx, 60),
                          top: 2,
                          height: TRACK_HEIGHT - 4,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                        title={`${audioEl.name} - ${audioEl.duration.toFixed(1)}s`}
                      >
                        {/* Waveform visualization */}
                        <svg
                          className="absolute inset-0 w-full h-full"
                          viewBox={`0 0 ${Math.max(audioWidthPx, 60)} ${TRACK_HEIGHT - 4}`}
                          preserveAspectRatio="none"
                          style={{ opacity: 0.6 }}
                        >
                          {Array.from({ length: Math.min(Math.max(Math.floor(audioWidthPx / 4), 10), 100) }, (_, i) => {
                            const x = (i / Math.max(Math.floor(audioWidthPx / 4), 10)) * Math.max(audioWidthPx, 60)
                            const height = Math.sin(i * 0.5 + audioIdx) * (TRACK_HEIGHT - 6) * 0.6 + (TRACK_HEIGHT - 6) * 0.5
                            return (
                              <rect
                                key={i}
                                x={x}
                                y={(TRACK_HEIGHT - 4 - height) / 2}
                                width="2"
                                height={height}
                                fill="#ffffff"
                                opacity="0.7"
                              />
                            )
                          })}
                        </svg>

                        {/* Fade in indicator */}
                        {audioEl.fadeIn > 0 && (
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-yellow-500/40 to-transparent rounded-l"
                            style={{ width: Math.max(audioEl.fadeIn * PX_PER_SEC, 2) }}
                            title={`Fade in: ${audioEl.fadeIn.toFixed(1)}s`}
                          />
                        )}
                        
                        {/* Fade out indicator */}
                        {audioEl.fadeOut > 0 && (
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-yellow-500/40 to-transparent rounded-r"
                            style={{ width: Math.max(audioEl.fadeOut * PX_PER_SEC, 2) }}
                            title={`Fade out: ${audioEl.fadeOut.toFixed(1)}s`}
                          />
                        )}

                        {/* Audio filename and duration info */}
                        <div className="absolute inset-0 flex items-center px-2 text-white text-2xs font-medium pointer-events-none overflow-hidden">
                          <span className="truncate">{fileName} • {audioEl.duration.toFixed(1)}s</span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => useEditorStore.getState().removeElement(audioEl.id)}
                        className="absolute -top-1 -right-1 p-0.5 rounded bg-red-500/80 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all z-10"
                        title="Delete audio"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Element animation tracks - HIDDEN to reduce clutter */}
          {/* Uncomment below if you want to show animation timelines again */}
          {/* 
          {currentSc && currentSc.elements.map((el, ei) => {
            const scStart = sceneStarts[currentSc.id]
            return (
              <div
                key={el.id}
                className="absolute left-0 right-0 border-b border-editor-border"
                style={{ top: RULER_HEIGHT + SCENE_HEIGHT + ei * TRACK_HEIGHT, height: TRACK_HEIGHT }}
              >
                <div
                  className="absolute left-0 flex items-center px-2 text-xs text-white truncate rounded-r-md"
                  style={{ 
                    width: 100, 
                    height: TRACK_HEIGHT - 4, 
                    top: 2,
                    background: '#2a2a2a', 
                    zIndex: 1,
                    fontWeight: 500
                  }}
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
                      className="absolute rounded-md text-white flex items-center gap-1 px-1.5 shadow-sm"
                      style={{
                        left: barStart + 105,
                        width: Math.max(barW, 4),
                        top: 3, height: TRACK_HEIGHT - 6,
                        background: ANIM_COLORS[anim.type] ?? '#6366f1',
                        fontSize: 9, lineHeight: `${TRACK_HEIGHT - 6}px`,
                        opacity: isLoop ? 0.85 : 1,
                        borderRight: isLoop ? '2px dashed rgba(255,255,255,0.4)' : undefined,
                        fontWeight: 500
                      }}
                      title={`${anim.type}${isLoop ? ' (loop)' : ''} - ${anim.duration}s`}
                    >
                      {ANIM_ICONS[anim.type]}
                      {barW > 40 && <span className="truncate">{anim.type}</span>}
                    </div>
                  )
                })}
              </div>
            )
          })}
          */}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 z-10"
            style={{ 
              left: playheadPx, 
              width: 1, 
              background: '#f59e0b',
              cursor: draggingPlayhead ? 'grabbing' : 'grab'
            }}
            onMouseDown={handlePlayheadMouseDown}
          >
            <div 
              className="w-2.5 h-2.5 bg-warning rounded-full -translate-x-[5px] cursor-grab hover:scale-110 transition-transform" 
              style={{ cursor: draggingPlayhead ? 'grabbing' : 'grab' }}
            />
          </div>
        </div>
      </div>

      {/* Context Menu for scenes */}
      <ContextMenu
        visible={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={[
          {
            label: 'Duplicate',
            icon: <Copy size={14} />,
            onClick: () => {
              if (contextMenu?.sceneId) {
                duplicateScene(contextMenu.sceneId)
              }
              setContextMenu(null)
            }
          },
          {
            label: 'Delete',
            icon: <Trash2 size={14} />,
            dangerous: true,
            onClick: () => {
              if (contextMenu?.sceneId) {
                removeScene(contextMenu.sceneId)
              }
              setContextMenu(null)
            }
          }
        ]}
        onClose={() => setContextMenu(null)}
      />
    </div>
  )
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1).padStart(4, '0')
  return `${m}:${sec}`
}
