import { useRef, useCallback, useEffect, useState } from 'react'
import { Plus, Play, Pause, SkipBack, ZoomIn, ZoomOut, Magnet, Music, Trash2, Copy, Scissors, Split, X, Volume2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { cn } from '../../utils/cn'
import { toFileUrl } from '../../utils/pathUtils'
import Tooltip from '../ui/Tooltip'
import ContextMenu from '../ui/ContextMenu'
import type { AudioElement } from '../../types/editor'

const RULER_HEIGHT = 18
const SCENE_HEIGHT = 36
const TRACK_HEIGHT = 32
const PX_PER_SEC_BASE = 60

const SCENE_COLORS = ['#3b82f6', '#0ea5e9', '#6366f1', '#4169e1']

const TRANS_COLORS: Record<string, string> = {
  fade: '#6366f1', slide: '#06b6d4', push: '#0891b2',
  zoom: '#22c55e', wipe: '#f59e0b', morph: '#ec4899'
}

const SPEED_OPTIONS = [
  { label: '0.25×', value: 0.25 },
  { label: '0.5×',  value: 0.5  },
  { label: '0.75×', value: 0.75 },
  { label: '1×',    value: 1    },
  { label: '1.25×', value: 1.25 },
  { label: '1.5×',  value: 1.5  },
  { label: '2×',    value: 2    },
]

export default function Timeline() {
  const {
    project, currentSceneId,
    playhead, isPlaying,
    timelineZoom, snapEnabled,
    addScene, setCurrentScene, updateScene, reorderScenes, removeScene, duplicateScene,
    setPlayhead, play, pause, stop,
    getTotalDuration,
    setTimelineZoom, setSnapEnabled,
    updateElement, removeElement, addElementToScene,
  } = useEditorStore()

  const [editDurId, setEditDurId] = useState<string | null>(null)
  const [resizingScene, setResizingScene] = useState<{ id: string; edge: 'start' | 'end' } | null>(null)
  const [resizingAudio, setResizingAudio] = useState<{ id: string; edge: 'start' | 'end' } | null>(null)
  const [draggingPlayhead, setDraggingPlayhead] = useState(false)
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sceneId: string } | null>(null)
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null)
  const [audioContextMenu, setAudioContextMenu] = useState<{
    x: number; y: number; audioId: string; clickTimeInAudio: number; sceneId: string
  } | null>(null)

  const containerRef    = useRef<HTMLDivElement>(null)
  const rafRef          = useRef<number>(0)
  const lastTimeRef     = useRef<number>(0)
  const audioPlayersRef = useRef<Map<string, HTMLAudioElement>>(new Map())

  const PX_PER_SEC = PX_PER_SEC_BASE * timelineZoom

  const snapTime = useCallback((time: number): number => {
    if (!snapEnabled) return time
    const gridSize = 0.1
    return Math.round(time / gridSize) * gridSize
  }, [snapEnabled])

  // Playback RAF — advances the playhead
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

  // Audio sync RAF — starts/stops HTMLAudioElements to match the playhead
  useEffect(() => {
    if (!isPlaying) {
      audioPlayersRef.current.forEach(p => p.pause())
      return
    }

    let rafId: number

    function syncAudio() {
      const { playhead: ph, project: proj } = useEditorStore.getState()
      if (!proj) { rafId = requestAnimationFrame(syncAudio); return }

      const activeIds = new Set<string>()
      let elapsed = 0

      for (const sc of proj.scenes) {
        for (const el of sc.elements) {
          if (el.type !== 'audio') continue
          const audio    = el as AudioElement
          const absStart = elapsed + (audio.x ?? 0)
          const absEnd   = absStart + (audio.duration ?? 0)

          if (ph >= absStart && ph < absEnd) {
            activeIds.add(audio.id)
            let player = audioPlayersRef.current.get(audio.id)

            if (!player) {
              player = new Audio(toFileUrl(audio.src))
              audioPlayersRef.current.set(audio.id, player)
            }

            player.volume       = audio.volume ?? 1
            player.playbackRate = audio.speed ?? 1

            if (player.paused) {
              player.currentTime = Math.max(0, (audio.startTime ?? 0) + (ph - absStart) * (audio.speed ?? 1))
              player.play().catch(() => {})
            }
          }
        }
        elapsed += sc.duration
      }

      // Pause clips no longer in the active window
      audioPlayersRef.current.forEach((player, id) => {
        if (!activeIds.has(id) && !player.paused) player.pause()
      })

      rafId = requestAnimationFrame(syncAudio)
    }

    rafId = requestAnimationFrame(syncAudio)
    return () => cancelAnimationFrame(rafId)
  }, [isPlaying])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioPlayersRef.current.forEach(p => { p.pause(); p.src = '' })
      audioPlayersRef.current.clear()
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          isPlaying ? pause() : play()
          break
        case 'ArrowLeft':
          if (!isPlaying) { e.preventDefault(); setPlayhead(Math.max(0, playhead - 1/30)) }
          break
        case 'ArrowRight':
          if (!isPlaying) { e.preventDefault(); setPlayhead(Math.min(getTotalDuration(), playhead + 1/30)) }
          break
        case 'Home':
          e.preventDefault(); setPlayhead(0); break
        case 'End':
          e.preventDefault(); setPlayhead(getTotalDuration()); break
        case '+': case '=':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); setTimelineZoom(Math.min(5, timelineZoom * 1.2)) }
          break
        case '-': case '_':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); setTimelineZoom(Math.max(0.1, timelineZoom / 1.2)) }
          break
        case '0':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); setTimelineZoom(1) }
          break
        case 'Delete': case 'Backspace': {
          if (selectedAudioId) {
            e.preventDefault()
            removeElement(selectedAudioId)
            setSelectedAudioId(null)
            break
          }
          const { selectedIds } = useEditorStore.getState()
          if (selectedIds.length === 0 && currentSceneId && project && project.scenes.length > 1) {
            e.preventDefault(); removeScene(currentSceneId)
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
    setPlayhead(snapTime(Math.max(0, Math.min(getTotalDuration(), x / PX_PER_SEC))))
  }, [setPlayhead, getTotalDuration, PX_PER_SEC, snapTime, draggingPlayhead])

  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingPlayhead(true)
    pause()

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + containerRef.current.scrollLeft
      setPlayhead(snapTime(Math.max(0, Math.min(getTotalDuration(), x / PX_PER_SEC))))
    }

    const handleMouseUp = () => {
      setDraggingPlayhead(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [pause, setPlayhead, getTotalDuration, PX_PER_SEC, snapTime])

  const handleSceneEdgeMouseDown = useCallback((sceneId: string, edge: 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation()
    setResizingScene({ id: sceneId, edge })

    const scene = project!.scenes.find(s => s.id === sceneId)!
    const startX       = e.clientX
    const startDuration = scene.duration

    const handleMouseMove = (e: MouseEvent) => {
      const deltaTime = (e.clientX - startX) / PX_PER_SEC
      const newDuration = edge === 'end'
        ? Math.max(0.5, startDuration + deltaTime)
        : Math.max(0.5, startDuration - deltaTime)
      updateScene(sceneId, { duration: snapTime(newDuration) })
    }

    const handleMouseUp = () => {
      setResizingScene(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [project, updateScene, PX_PER_SEC, snapTime])

  // Drag an audio clip to reposition it
  function handleAudioMouseDown(e: React.MouseEvent, audioId: string, audioX: number) {
    e.stopPropagation()

    const wasSelected = selectedAudioId === audioId
    const startMouseX = e.clientX
    const pxPerSec    = PX_PER_SEC
    let moved         = false

    if (!wasSelected) setSelectedAudioId(audioId)

    const handleMouseMove = (mv: MouseEvent) => {
      if (!moved && Math.abs(mv.clientX - startMouseX) < 3) return
      moved = true
      setSelectedAudioId(audioId)
      updateElement(audioId, { x: Math.max(0, audioX + (mv.clientX - startMouseX) / pxPerSec) })
    }

    const handleMouseUp = () => {
      if (!moved && wasSelected) setSelectedAudioId(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Resize an audio clip from its left or right edge
  function handleAudioResizeMouseDown(e: React.MouseEvent, audioEl: AudioElement, edge: 'start' | 'end') {
    e.stopPropagation()
    e.preventDefault()
    setResizingAudio({ id: audioEl.id, edge })
    setSelectedAudioId(audioEl.id)

    const startMouseX   = e.clientX
    const origX         = audioEl.x ?? 0
    const origDuration  = audioEl.duration ?? 0
    const origStartTime = audioEl.startTime ?? 0
    const speed         = audioEl.speed ?? 1

    const handleMouseMove = (mv: MouseEvent) => {
      const delta = (mv.clientX - startMouseX) / PX_PER_SEC
      if (edge === 'end') {
        updateElement(audioEl.id, { duration: Math.max(0.1, origDuration + delta) })
      } else {
        const newX        = Math.max(0, origX + delta)
        const actualDelta = newX - origX
        updateElement(audioEl.id, {
          x:         newX,
          startTime: Math.max(0, origStartTime + actualDelta * speed),
          duration:  Math.max(0.1, origDuration - actualDelta),
        })
      }
    }

    const handleMouseUp = () => {
      setResizingAudio(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (!project) return (
    <div className="flex flex-col bg-orange flex-none" style={{ height: 120 }}>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-editor-border">
        <span className="text-xs text-[#c1c1c1]">Timeline</span>
      </div>
    </div>
  )

  const totalDur = getTotalDuration()
  const totalPx  = totalDur * PX_PER_SEC

  const sceneStarts: Record<string, number> = {}
  let acc = 0
  for (const sc of project.scenes) {
    sceneStarts[sc.id] = acc
    acc += sc.duration
  }

  // Include audio clips that extend past the scene area in scroll width
  const maxAudioRightPx = project.scenes.reduce((max, sc) => {
    const scStart = sceneStarts[sc.id] ?? 0
    for (const el of sc.elements) {
      if (el.type !== 'audio') continue
      const a = el as AudioElement
      const rightPx = (scStart + (a.x ?? 0) + (a.duration ?? 0)) * PX_PER_SEC
      if (rightPx > max) max = rightPx
    }
    return max
  }, 0)

  const playheadPx = playhead * PX_PER_SEC

  // Find selected audio across ALL scenes
  let selectedAudio: AudioElement | undefined
  if (selectedAudioId) {
    for (const sc of project.scenes) {
      const found = sc.elements.find(e => e.id === selectedAudioId && e.type === 'audio') as AudioElement | undefined
      if (found) { selectedAudio = found; break }
    }
  }

  function findAudioScene(audioId: string) {
    let elapsed = 0
    for (const sc of project!.scenes) {
      if (sc.elements.some(e => e.id === audioId)) return { scene: sc, sceneStart: elapsed }
      elapsed += sc.duration
    }
    return null
  }

  function trimAtPlayhead() {
    if (!selectedAudio) return
    const result = findAudioScene(selectedAudio.id)
    if (!result) return
    const clipTime = playhead - (result.sceneStart + selectedAudio.x)
    if (clipTime <= 0.1) return
    updateElement(selectedAudio.id, { duration: Math.max(0.1, clipTime) })
  }

  function splitAtPlayhead() {
    if (!selectedAudio) return
    const result = findAudioScene(selectedAudio.id)
    if (!result) return
    const clipTime = playhead - (result.sceneStart + selectedAudio.x)
    if (clipTime <= 0.1 || clipTime >= selectedAudio.duration - 0.1) return

    updateElement(selectedAudio.id, { duration: clipTime })
    addElementToScene(result.scene.id, {
      ...JSON.parse(JSON.stringify(selectedAudio)),
      id: crypto.randomUUID(),
      x: selectedAudio.x + clipTime,
      startTime: selectedAudio.startTime + clipTime,
      duration: selectedAudio.duration - clipTime,
    })
  }

  function trimAfterAtContextPosition() {
    if (!audioContextMenu) return
    const { audioId, sceneId, clickTimeInAudio } = audioContextMenu
    const sc    = project.scenes.find(s => s.id === sceneId)
    const audio = sc?.elements.find(e => e.id === audioId) as AudioElement | undefined
    if (!audio || clickTimeInAudio <= 0.1) return
    updateElement(audioId, { duration: Math.max(0.1, clickTimeInAudio) })
    setAudioContextMenu(null)
  }

  function trimBeforeAtContextPosition() {
    if (!audioContextMenu) return
    const { audioId, sceneId, clickTimeInAudio } = audioContextMenu
    const sc    = project.scenes.find(s => s.id === sceneId)
    const audio = sc?.elements.find(e => e.id === audioId) as AudioElement | undefined
    if (!audio || clickTimeInAudio >= audio.duration - 0.1) return
    const speed = audio.speed ?? 1
    updateElement(audioId, {
      x:         (audio.x ?? 0) + clickTimeInAudio,
      startTime: (audio.startTime ?? 0) + clickTimeInAudio * speed,
      duration:  audio.duration - clickTimeInAudio,
    })
    setAudioContextMenu(null)
  }

  function splitAtContextPosition() {
    if (!audioContextMenu) return
    const { audioId, sceneId, clickTimeInAudio } = audioContextMenu
    const sc    = project.scenes.find(s => s.id === sceneId)
    const audio = sc?.elements.find(e => e.id === audioId) as AudioElement | undefined
    if (!audio || clickTimeInAudio <= 0.1 || clickTimeInAudio >= audio.duration - 0.1) return

    updateElement(audioId, { duration: clickTimeInAudio })
    addElementToScene(sceneId, {
      ...JSON.parse(JSON.stringify(audio)),
      id: crypto.randomUUID(),
      x: audio.x + clickTimeInAudio,
      startTime: audio.startTime + clickTimeInAudio,
      duration: audio.duration - clickTimeInAudio,
    })
    setAudioContextMenu(null)
  }

  // Collect all audio clips across every scene for rendering
  const allAudioClips = project.scenes.flatMap(sc => {
    const scStart = sceneStarts[sc.id] ?? 0
    return sc.elements
      .filter(el => el.type === 'audio')
      .map((el, idx) => ({ audio: el as AudioElement, sc, scStart, idx }))
  })

  return (
    <div className="flex flex-col bg-[#171717] flex-none" style={{ height: 160 }}>
      {/* Controls row */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-editor-border flex-none min-w-0 overflow-hidden">
        <Tooltip text="Stop (Home)">
          <button onClick={stop} className="text-[#c1c1c1] hover:text-editor-text transition-colors flex-none">
            <SkipBack size={12} />
          </button>
        </Tooltip>

        <Tooltip text={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
          <button
            onClick={() => isPlaying ? pause() : play()}
            className="flex items-center justify-center w-6 h-6 rounded bg-editor-accent hover:bg-editor-accent-hover text-white transition-colors flex-none"
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          </button>
        </Tooltip>

        <span className="text-xs text-[#c1c1c1] tabular-nums ml-1 flex-none">
          {fmtTime(playhead)} / {fmtTime(totalDur)}
        </span>

        <div className="w-px h-4 bg-editor-border mx-1 flex-none" />

        <Tooltip text="Zoom Out (Ctrl -)">
          <button onClick={() => setTimelineZoom(Math.max(0.1, timelineZoom / 1.2))} className="text-[#c1c1c1] hover:text-editor-text transition-colors flex-none">
            <ZoomOut size={12} />
          </button>
        </Tooltip>

        <span className="text-xs text-[#c1c1c1] tabular-nums min-w-[36px] text-center flex-none">
          {Math.round(timelineZoom * 100)}%
        </span>

        <Tooltip text="Zoom In (Ctrl +)">
          <button onClick={() => setTimelineZoom(Math.min(5, timelineZoom * 1.2))} className="text-[#c1c1c1] hover:text-editor-text transition-colors flex-none">
            <ZoomIn size={12} />
          </button>
        </Tooltip>

        <Tooltip text="Reset Zoom (Ctrl 0)">
          <button onClick={() => setTimelineZoom(1)} className="text-xs text-[#c1c1c1] hover:text-editor-text transition-colors px-1 flex-none">
            1:1
          </button>
        </Tooltip>

        <Tooltip text="Snap to Grid">
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors flex-none',
              snapEnabled ? 'bg-editor-accent-dim text-editor-accent' : 'text-[#c1c1c1] hover:text-editor-text'
            )}
          >
            <Magnet size={11} />
          </button>
        </Tooltip>

        {selectedAudio ? (
          <>
            <div className="w-px h-4 bg-editor-border mx-1 flex-none" />
            <Music size={11} className="text-emerald-400 flex-none" />

            <div className="flex items-center gap-1 flex-none">
              <Volume2 size={10} className="text-[#c1c1c1]" />
              <input
                type="range" min={0} max={1} step={0.01}
                value={selectedAudio.volume ?? 1}
                onChange={e => updateElement(selectedAudio!.id, { volume: parseFloat(e.target.value) })}
                className="w-16 accent-emerald-400"
              />
              <span className="text-[10px] text-[#c1c1c1] w-7 flex-none">
                {Math.round((selectedAudio.volume ?? 1) * 100)}%
              </span>
            </div>

            <select
              value={selectedAudio.speed ?? 1}
              onChange={e => {
                const newSpeed  = parseFloat(e.target.value)
                const rawAudioS = selectedAudio!.duration * (selectedAudio!.speed ?? 1)
                updateElement(selectedAudio!.id, { speed: newSpeed, duration: rawAudioS / newSpeed })
              }}
              className="bg-editor-elevated border border-editor-border rounded text-[10px] text-editor-text px-1 py-0.5 flex-none"
              title="Playback speed"
            >
              {SPEED_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div className="flex items-center gap-1 flex-none">
              <span className="text-[10px] text-[#c1c1c1]">FI</span>
              <input
                type="number" min={0} max={10} step={0.1}
                value={selectedAudio.fadeIn}
                onChange={e => updateElement(selectedAudio!.id, { fadeIn: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-10 bg-editor-elevated border border-editor-border rounded text-[10px] text-editor-text px-1 py-0.5 nodrag"
                title="Fade in (seconds)"
              />
              <span className="text-[10px] text-[#c1c1c1]">s</span>
            </div>

            <div className="flex items-center gap-1 flex-none">
              <span className="text-[10px] text-[#c1c1c1]">FO</span>
              <input
                type="number" min={0} max={10} step={0.1}
                value={selectedAudio.fadeOut}
                onChange={e => updateElement(selectedAudio!.id, { fadeOut: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-10 bg-editor-elevated border border-editor-border rounded text-[10px] text-editor-text px-1 py-0.5 nodrag"
                title="Fade out (seconds)"
              />
              <span className="text-[10px] text-[#c1c1c1]">s</span>
            </div>

            <div className="w-px h-4 bg-editor-border mx-0.5 flex-none" />

            <Tooltip text="Trim after playhead (cut end)">
              <button
                onClick={trimAtPlayhead}
                className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-editor-elevated border border-editor-border text-[#c1c1c1] hover:text-editor-text hover:border-editor-text/40 transition-colors flex-none"
              >
                <Scissors size={10} /> Trim ▶
              </button>
            </Tooltip>

            <Tooltip text="Split at playhead">
              <button
                onClick={splitAtPlayhead}
                className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-editor-elevated border border-editor-border text-[#c1c1c1] hover:text-editor-text hover:border-editor-text/40 transition-colors flex-none"
              >
                <Split size={10} /> Split
              </button>
            </Tooltip>

            <button
              onClick={() => setSelectedAudioId(null)}
              className="text-[#c1c1c1] hover:text-editor-text transition-colors flex-none"
              title="Deselect audio"
            >
              <X size={10} />
            </button>
          </>
        ) : (
          <>
            <div className="flex-1" />
            <span className="text-2xs text-[#c1c1c1]">Drag scene edges • Drag playhead • Space to play</span>
          </>
        )}

        <div className="flex-1" />

        <Tooltip text="Add Scene">
          <button
            onClick={addScene}
            className="flex items-center gap-1 text-xs text-editor-accent hover:text-white px-2 py-1 rounded border border-editor-accent hover:bg-editor-accent transition-colors flex-none"
          >
            <Plus size={11} /> Scene
          </button>
        </Tooltip>
      </div>

      {/* Scrollable track area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative cursor-pointer"
        onMouseDown={handleRulerClick}
      >
        <div className="relative" style={{ width: Math.max(totalPx + 120, maxAudioRightPx + 120, 600), height: '100%' }}>

          {/* Time ruler */}
          <div className="absolute top-0 left-0 right-0" style={{ height: RULER_HEIGHT }}>
            {Array.from({ length: Math.ceil(totalDur) + 1 }, (_, i) => (
              <div key={i} className="absolute flex flex-col items-start" style={{ left: i * PX_PER_SEC }}>
                <div className="w-px h-2 bg-editor-border-strong" />
                <span className="text-[#c1c1c1]" style={{ fontSize: 9 }}>{fmtTime(i)}</span>
              </div>
            ))}
          </div>

          {/* Scene blocks */}
          <div className="absolute left-0 right-0" style={{ top: RULER_HEIGHT, height: SCENE_HEIGHT }}>
            {project.scenes.map((sc, index) => {
              const startPx    = sceneStarts[sc.id] * PX_PER_SEC
              const widthPx    = sc.duration * PX_PER_SEC
              const hasTrans   = sc.transition && sc.transition.type !== 'none'
              const transColor = hasTrans ? (TRANS_COLORS[sc.transition.type] ?? '#6366f1') : null
              const isResizing  = resizingScene?.id === sc.id
              const isDragging  = draggedSceneIndex === index
              const isDropTarget = dropTargetIndex === index
              const sceneColor  = SCENE_COLORS[index % SCENE_COLORS.length]
              const isActive    = sc.id === currentSceneId

              return (
                <div
                  key={sc.id}
                  draggable
                  onDragStart={e => { setDraggedSceneIndex(index); e.dataTransfer.effectAllowed = 'move' }}
                  onDragEnd={() => { setDraggedSceneIndex(null); setDropTargetIndex(null) }}
                  onDragOver={e => { e.preventDefault(); setDropTargetIndex(index) }}
                  onDragLeave={() => setDropTargetIndex(null)}
                  onDrop={e => {
                    e.preventDefault()
                    if (draggedSceneIndex !== null && draggedSceneIndex !== index) reorderScenes(draggedSceneIndex, index)
                    setDraggedSceneIndex(null); setDropTargetIndex(null)
                  }}
                  onClick={e => { e.stopPropagation(); setCurrentScene(sc.id) }}
                  onContextMenu={e => {
                    e.preventDefault(); e.stopPropagation()
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
                    left: startPx, width: widthPx,
                    height: SCENE_HEIGHT - 4, top: 2,
                    background: sceneColor, color: 'white',
                    fontWeight: isActive ? 600 : 400
                  }}
                >
                  {transColor && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md" style={{ background: transColor }} />
                  )}

                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 rounded-l-md z-10"
                    onMouseDown={e => handleSceneEdgeMouseDown(sc.id, 'start', e)}
                  />

                  <span className="truncate flex-1 pl-1 font-medium">{sc.name}</span>

                  {editDurId === sc.id ? (
                    <input
                      autoFocus type="number" defaultValue={sc.duration} min={0.5} max={120} step={0.5}
                      className="w-12 bg-white/20 border border-white/40 rounded text-xs text-white px-1 nodrag"
                      onBlur={e => { updateScene(sc.id, { duration: Math.max(0.5, Number(e.target.value)) }); setEditDurId(null) }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { updateScene(sc.id, { duration: Math.max(0.5, Number(e.currentTarget.value)) }); setEditDurId(null) }
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
                      {Number(sc.duration).toFixed(2)}s
                    </span>
                  )}

                  <div
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 rounded-r-md z-10"
                    onMouseDown={e => handleSceneEdgeMouseDown(sc.id, 'end', e)}
                  />
                </div>
              )
            })}
          </div>

          {/* Audio tracks — rendered for ALL scenes so they stay visible when switching scenes */}
          <div className="absolute left-0 right-0" style={{ top: RULER_HEIGHT + SCENE_HEIGHT, height: 'auto' }}>
            {allAudioClips.map(({ audio, sc, scStart, idx }) => {
              const audioDur     = audio.duration ?? 30
              const audioStartPx = (scStart + (audio.x ?? 0)) * PX_PER_SEC
              const audioWidthPx = audioDur * PX_PER_SEC
              const fileName     = (audio.name ?? 'Audio').substring(0, 10)
              const isSelected   = selectedAudioId === audio.id

              return (
                <div
                  key={audio.id}
                  className="relative border-b border-editor-border/50"
                  style={{ height: TRACK_HEIGHT }}
                >
                  <div
                    className={cn(
                      'absolute rounded overflow-hidden transition-shadow select-none cursor-grab',
                      isSelected
                        ? 'ring-2 ring-white shadow-lg shadow-emerald-500/20'
                        : 'hover:ring-2 hover:ring-emerald-400/60'
                    )}
                    style={{
                      left: audioStartPx,
                      width: Math.max(audioWidthPx, 60),
                      top: 2,
                      height: TRACK_HEIGHT - 4,
                      background: isSelected
                        ? 'linear-gradient(135deg, #34d399 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #064732 0%, #059669 100%)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                    title={`${audio.name ?? 'Audio'} — ${audioDur.toFixed(1)}s — drag to reposition`}
                    onMouseDown={e => handleAudioMouseDown(e, audio.id, audio.x ?? 0)}
                    onContextMenu={e => {
                      e.preventDefault(); e.stopPropagation()
                      const barRect = e.currentTarget.getBoundingClientRect()
                      const clickTimeInAudio = (e.clientX - barRect.left) / PX_PER_SEC
                      setAudioContextMenu({
                        x: e.clientX, y: e.clientY,
                        audioId: audio.id,
                        sceneId: sc.id,
                        clickTimeInAudio: Math.max(0, Math.min(audioDur, clickTimeInAudio)),
                      })
                      setSelectedAudioId(audio.id)
                    }}
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
                        const h = Math.sin(i * 0.5 + idx) * (TRACK_HEIGHT - 6) * 0.6 + (TRACK_HEIGHT - 6) * 0.5
                        return <rect key={i} x={x} y={(TRACK_HEIGHT - 4 - h) / 2} width="2" height={h} fill="#ffffff" opacity="0.7" />
                      })}
                    </svg>

                    {audio.fadeIn > 0 && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-yellow-400/50 to-transparent rounded-l"
                        style={{ width: Math.max(audio.fadeIn * PX_PER_SEC, 2) }}
                        title={`Fade in: ${audio.fadeIn.toFixed(1)}s`}
                      />
                    )}
                    {audio.fadeOut > 0 && (
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-yellow-400/50 to-transparent rounded-r"
                        style={{ width: Math.max(audio.fadeOut * PX_PER_SEC, 2) }}
                        title={`Fade out: ${audio.fadeOut.toFixed(1)}s`}
                      />
                    )}

                    <div className="absolute inset-0 flex items-center px-2 text-white text-2xs font-medium pointer-events-none overflow-hidden gap-1">
                      <Music size={8} />
                      <span className="truncate">{fileName} • {audioDur.toFixed(1)}s</span>
                      {(audio.speed ?? 1) !== 1 && <span className="flex-none opacity-80">{audio.speed}×</span>}
                    </div>

                    {/* Left resize handle */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-l z-10"
                      onMouseDown={e => handleAudioResizeMouseDown(e, audio, 'start')}
                      title="Drag to trim start"
                    />
                    {/* Right resize handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-r z-10"
                      onMouseDown={e => handleAudioResizeMouseDown(e, audio, 'end')}
                      title="Drag to trim end"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 z-10"
            style={{ left: playheadPx, width: 1, background: '#f59e0b', cursor: draggingPlayhead ? 'grabbing' : 'grab' }}
            onMouseDown={handlePlayheadMouseDown}
          >
            <div
              className="w-2.5 h-2.5 bg-warning rounded-full -translate-x-[5px] hover:scale-110 transition-transform"
              style={{ cursor: draggingPlayhead ? 'grabbing' : 'grab' }}
            />
          </div>
        </div>
      </div>

      {/* Context Menu — scenes */}
      <ContextMenu
        visible={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={[
          {
            label: 'Duplicate',
            icon: <Copy size={14} />,
            onClick: () => { if (contextMenu?.sceneId) duplicateScene(contextMenu.sceneId); setContextMenu(null) }
          },
          {
            label: 'Delete',
            icon: <Trash2 size={14} />,
            dangerous: true,
            onClick: () => { if (contextMenu?.sceneId) removeScene(contextMenu.sceneId); setContextMenu(null) }
          }
        ]}
        onClose={() => setContextMenu(null)}
      />

      {/* Context Menu — audio clips */}
      <ContextMenu
        visible={audioContextMenu !== null}
        x={audioContextMenu?.x ?? 0}
        y={audioContextMenu?.y ?? 0}
        items={[
          {
            label: 'Duplicate',
            icon: <Copy size={14} />,
            onClick: () => {
              if (audioContextMenu) {
                const sc    = project.scenes.find(s => s.id === audioContextMenu.sceneId)
                const audio = sc?.elements.find(e => e.id === audioContextMenu.audioId) as AudioElement | undefined
                if (audio && sc) {
                  addElementToScene(sc.id, {
                    ...JSON.parse(JSON.stringify(audio)),
                    id: crypto.randomUUID(),
                    x: audio.x + audio.duration + 0.1,
                  })
                }
              }
              setAudioContextMenu(null)
            }
          },
          {
            label: `Trim after (${audioContextMenu ? audioContextMenu.clickTimeInAudio.toFixed(1) : 0}s)`,
            icon: <Scissors size={14} />,
            onClick: trimAfterAtContextPosition,
          },
          {
            label: `Trim before (${audioContextMenu ? audioContextMenu.clickTimeInAudio.toFixed(1) : 0}s)`,
            icon: <Scissors size={14} />,
            onClick: trimBeforeAtContextPosition,
          },
          {
            label: `Split here (${audioContextMenu ? audioContextMenu.clickTimeInAudio.toFixed(1) : 0}s)`,
            icon: <Split size={14} />,
            onClick: splitAtContextPosition,
          },
          {
            label: 'Delete',
            icon: <Trash2 size={14} />,
            dangerous: true,
            onClick: () => {
              if (audioContextMenu) {
                removeElement(audioContextMenu.audioId)
                if (selectedAudioId === audioContextMenu.audioId) setSelectedAudioId(null)
              }
              setAudioContextMenu(null)
            }
          },
        ]}
        onClose={() => setAudioContextMenu(null)}
      />
    </div>
  )
}

function fmtTime(s: number) {
  const m   = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1).padStart(4, '0')
  return `${m}:${sec}`
}
