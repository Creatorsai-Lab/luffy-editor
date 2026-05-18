import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { Plus, Play, Pause, SkipBack, ZoomIn, ZoomOut, Magnet, Music, Trash2, Copy, Scissors, Split, X, Volume2, Bookmark } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { cn } from '../../utils/cn'
import { toFileUrl } from '../../utils/pathUtils'
import { getWaveform } from '../../utils/waveform'
import type { WaveformData } from '../../utils/waveform'
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

const MARKER_COLOR = '#33dd08'

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
    addTimeMarker, removeTimeMarker,
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
    x: number; y: number; audioId: string; clickTimeInAudio: number; sceneId: string; absoluteTime: number
  } | null>(null)
  const [timelineContextMenu, setTimelineContextMenu] = useState<{ x: number; y: number; time: number } | null>(null)

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

  // Audio sync RAF
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

      audioPlayersRef.current.forEach((player, id) => {
        if (!activeIds.has(id) && !player.paused) player.pause()
      })

      rafId = requestAnimationFrame(syncAudio)
    }

    rafId = requestAnimationFrame(syncAudio)
    return () => cancelAnimationFrame(rafId)
  }, [isPlaying])

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
    if (e.button !== 0) return  // left click only
    if (!containerRef.current || draggingPlayhead) return
    const rect = containerRef.current.getBoundingClientRect()
    const x    = e.clientX - rect.left + containerRef.current.scrollLeft
    setPlayhead(snapTime(Math.max(0, Math.min(getTotalDuration(), x / PX_PER_SEC))))
  }, [setPlayhead, getTotalDuration, PX_PER_SEC, snapTime, draggingPlayhead])

  const handleContainerContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + containerRef.current.scrollLeft
    const time = snapTime(Math.max(0, Math.min(getTotalDuration(), x / PX_PER_SEC)))
    setTimelineContextMenu({ x: e.clientX, y: e.clientY, time })
  }, [PX_PER_SEC, getTotalDuration, snapTime])

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
    if (!audioContextMenu || !project) return
    const { audioId, sceneId, clickTimeInAudio } = audioContextMenu
    const sc    = project.scenes.find(s => s.id === sceneId)
    const audio = sc?.elements.find(e => e.id === audioId) as AudioElement | undefined
    if (!audio || clickTimeInAudio <= 0.1) return
    updateElement(audioId, { duration: Math.max(0.1, clickTimeInAudio) })
    setAudioContextMenu(null)
  }

  function trimBeforeAtContextPosition() {
    if (!audioContextMenu || !project) return
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
    if (!audioContextMenu || !project) return
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

  const allAudioClips = project.scenes.flatMap(sc => {
    const scStart = sceneStarts[sc.id] ?? 0
    return sc.elements
      .filter(el => el.type === 'audio')
      .map((el, idx) => ({ audio: el as AudioElement, sc, scStart, idx }))
  })

  const timeMarkers = project.timeMarkers ?? []

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
            <Music size={13} className="text-[#79443e] flex-none" />

            <div className="flex items-center gap-1 flex-none">
              <Volume2 size={13} className="text-[#c1c1c1]" />
              <input
                type="range" min={0} max={1} step={0.01}
                value={selectedAudio.volume ?? 1}
                onChange={e => updateElement(selectedAudio!.id, { volume: parseFloat(e.target.value) })}
                className="w-20 accent-[#79443e]"
              />
              <span className="text-[10px] text-[#c1c1c1] w-10 flex-none">
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
            <span className="text-2xs text-[#c1c1c1]">Drag scene edges • Drag playhead • Right-click to add marker</span>
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
        onContextMenu={handleContainerContextMenu}
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

          {/* Audio tracks */}
          <div className="absolute left-0 right-0" style={{ top: RULER_HEIGHT + SCENE_HEIGHT, height: 'auto' }}>
            {allAudioClips.map(({ audio, sc, scStart }) => {
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
                      'absolute rounded overflow-hidden transition-shadow select-none cursor-grab group',
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
                        ? 'linear-gradient(135deg, #79443e 0%, #883a31 100%)'
                        : 'linear-gradient(135deg, #8a7e7c 0%, #8f7978 100%)',
                      boxShadow: '0 2px 8px rgba(3, 3, 3, 0.3)',
                      color: 'black'
                    }}
                    title={`${audio.name ?? 'Audio'} — ${audioDur.toFixed(1)}s — drag to reposition`}
                    onMouseDown={e => handleAudioMouseDown(e, audio.id, audio.x ?? 0)}
                    onContextMenu={e => {
                      e.preventDefault(); e.stopPropagation()
                      const barRect = e.currentTarget.getBoundingClientRect()
                      const clickTimeInAudio = (e.clientX - barRect.left) / PX_PER_SEC
                      const clipped = Math.max(0, Math.min(audioDur, clickTimeInAudio))
                      const absoluteTime = scStart + (audio.x ?? 0) + clipped
                      setAudioContextMenu({
                        x: e.clientX, y: e.clientY,
                        audioId: audio.id,
                        sceneId: sc.id,
                        clickTimeInAudio: clipped,
                        absoluteTime,
                      })
                      setSelectedAudioId(audio.id)
                    }}
                  >
                    {/* Real waveform */}
                    <AudioWaveformView
                      url={toFileUrl(audio.src)}
                      startTime={audio.startTime ?? 0}
                      clipDuration={audioDur}
                      speed={audio.speed ?? 1}
                      clipWidthPx={Math.max(audioWidthPx, 60)}
                      trackH={TRACK_HEIGHT - 4}
                    />

                    {audio.fadeIn > 0 && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-yellow-400/40 to-transparent rounded-l pointer-events-none"
                        style={{ width: Math.max(audio.fadeIn * PX_PER_SEC, 2) }}
                        title={`Fade in: ${audio.fadeIn.toFixed(1)}s`}
                      />
                    )}
                    {audio.fadeOut > 0 && (
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-yellow-400/40 to-transparent rounded-r pointer-events-none"
                        style={{ width: Math.max(audio.fadeOut * PX_PER_SEC, 2) }}
                        title={`Fade out: ${audio.fadeOut.toFixed(1)}s`}
                      />
                    )}

                    <div
                      className="absolute inset-0 flex items-center px-2 text-white text-2xs font-medium pointer-events-none overflow-hidden gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      
                    >
                      <span className="truncate bg-gray-500/60 p-1">{fileName} • {audioDur.toFixed(1)}s</span>
                      {(audio.speed ?? 1) !== 1 && <span className="flex-none opacity-80">{audio.speed}×</span>}
                    </div>

                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-l z-10"
                      onMouseDown={e => handleAudioResizeMouseDown(e, audio, 'start')}
                      title="Drag to trim start"
                    />
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

          {/* Time markers — confined to the audio track area only */}
{timeMarkers.map(marker => {
  const markerPx = marker.time * PX_PER_SEC
  return (
    <div
      key={marker.id}
      className="absolute z-20 pointer-events-none"
      style={{
        left: markerPx,
        top: RULER_HEIGHT + SCENE_HEIGHT,
        bottom: 0,
      }}
    >
      {/* Dense Dotted vertical line (2px line, 2px gap) */}
      <div
        className="absolute"
        style={{
          top: 0, bottom: 0, left: 0, width: 1.5,
          background: `repeating-linear-gradient(to bottom, ${MARKER_COLOR} 0px, ${MARKER_COLOR} 2px, transparent 2px, transparent 4px)`,
          opacity: 0.9,
        }}
      />
      
      {/* Clickable circular caret at top of audio area */}
      <div
        className="absolute pointer-events-auto cursor-pointer group flex items-center justify-center rounded-full"
        style={{ 
          top: -2.2, 
          left: -1.1,
          width: 5, 
          height: 5,
          backgroundColor: MARKER_COLOR
        }}
        onClick={e => { e.stopPropagation(); removeTimeMarker(marker.id) }}
        title={`${fmtTime(marker.time)} — click to remove`}
      >
      </div>
    </div>
  )
})}
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 z-30"
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
            label: `Add time mark at ${audioContextMenu ? fmtTime(audioContextMenu.absoluteTime) : '0:00.0'}`,
            icon: <Bookmark size={14} />,
            onClick: () => {
              if (audioContextMenu) addTimeMarker(audioContextMenu.absoluteTime)
              setAudioContextMenu(null)
            }
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

      {/* Context Menu — timeline (ruler / empty track area) */}
      <ContextMenu
        visible={timelineContextMenu !== null}
        x={timelineContextMenu?.x ?? 0}
        y={timelineContextMenu?.y ?? 0}
        items={[
          {
            label: `Add time mark at ${timelineContextMenu ? fmtTime(timelineContextMenu.time) : '0:00.0'}`,
            icon: <Bookmark size={14} />,
            onClick: () => {
              if (timelineContextMenu) addTimeMarker(timelineContextMenu.time)
              setTimelineContextMenu(null)
            }
          },
          ...(timeMarkers.length > 0 ? [{
            label: 'Clear all markers',
            icon: <Trash2 size={14} />,
            dangerous: true,
            onClick: () => {
              timeMarkers.forEach(m => removeTimeMarker(m.id))
              setTimelineContextMenu(null)
            }
          }] : [])
        ]}
        onClose={() => setTimelineContextMenu(null)}
      />
    </div>
  )
}

// ── Real audio waveform component ──────────────────────────────────────────────

function AudioWaveformView({ url, startTime, clipDuration, speed, clipWidthPx, trackH }: {
  url: string
  startTime: number
  clipDuration: number
  speed: number
  clipWidthPx: number
  trackH: number
}) {
  const [waveData, setWaveData] = useState<WaveformData | null>(null)

  useEffect(() => {
    let cancelled = false
    getWaveform(url).then(data => { if (!cancelled) setWaveData(data) })
    return () => { cancelled = true }
  }, [url])

  const svgW     = Math.max(clipWidthPx, 60)
  const barCount = Math.max(5, Math.floor(svgW / 3))
  const centerY  = trackH / 2

  const bars = useMemo(() => {
    if (!waveData) {
      // Fallback: subtle sine placeholder until decode finishes
      return Array.from({ length: barCount }, (_, i) => {
        const amp = Math.sin(i * 0.6) * 0.25 + 0.35
        return Math.max(2, amp * (trackH - 6))
      })
    }

    const { samples, duration } = waveData
    // Map the trim window into sample indices
    const normStart = Math.min(1, Math.max(0, startTime / duration))
    const normEnd   = Math.min(1, Math.max(0, (startTime + clipDuration * speed) / duration))
    const startIdx  = Math.floor(normStart * samples.length)
    const endIdx    = Math.ceil(normEnd * samples.length)
    const sliceLen  = Math.max(1, endIdx - startIdx)

    return Array.from({ length: barCount }, (_, i) => {
      const pos  = (i / barCount) * sliceLen
      const idx  = startIdx + Math.min(Math.floor(pos), sliceLen - 1)
      const amp  = samples[idx] ?? 0
      return Math.max(2, amp * (trackH - 6))
    })
  }, [waveData, barCount, startTime, clipDuration, speed, trackH])

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={svgW}
      height={trackH}
      style={{ opacity: waveData ? 0.75 : 0.3 }}
    >
      {bars.map((barH, i) => (
        <rect
          key={i}
          x={i * (svgW / barCount)}
          y={centerY - barH / 2}
          width={1.5}
          height={barH}
          fill="#eba9a4"
        />
      ))}
    </svg>
  )
}

function fmtTime(s: number) {
  const m   = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1).padStart(4, '0')
  return `${m}:${sec}`
}
