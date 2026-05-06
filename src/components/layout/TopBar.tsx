import { useState, useEffect } from 'react'
import { Play, Download, Monitor, ChevronDown, Undo2, Redo2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { useHistoryStore } from '../../store/historyStore'
import { CANVAS_PRESETS } from '../../types/editor'
import { cn } from '../../utils/cn'
import Tooltip from '../ui/Tooltip'

export default function TopBar() {
  const {
    project,
    setProjectName, setCanvasSize, setActivePanel,
    setPreviewOpen, setExportOpen,
    undo, redo
  } = useEditorStore()

  const { canUndo, canRedo } = useHistoryStore()

  const [editingName, setEditingName] = useState(false)
  const [sizeOpen,    setSizeOpen]    = useState(false)

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement) return
      if (e.target instanceof HTMLTextAreaElement) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) undo()
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (canRedo) redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, undo, redo])

  const preset = project
    ? CANVAS_PRESETS.find(p => p.width === project.width && p.height === project.height)
    : null

  const sizeLabel = project
    ? (preset?.label ?? `${project.width}×${project.height}`)
    : '—'

  return (
    <div className="h-8 bg-[#171717] border-b border-editor-border flex items-center gap-3 px-4 flex-none nodrag">
      {/* Project name */}
      {project && editingName ? (
        <input
          autoFocus
          className="bg-editor-elevated border border-editor-accent text-editor-text text-xs px-2 py-0.5 rounded w-40"
          defaultValue={project.name}
          onBlur={e  => { setProjectName(e.target.value); setEditingName(false) }}
          onKeyDown={e => {
            if (e.key === 'Enter') { setProjectName(e.currentTarget.value); setEditingName(false) }
            if (e.key === 'Escape') setEditingName(false)
          }}
        />
      ) : (
        <button
          onClick={() => project && setEditingName(true)}
          disabled={!project}
          className="text-xs text-editor-text hover:text-white px-1.5 py-0.5 rounded hover:bg-editor-hover transition-colors max-w-[160px] truncate disabled:text-editor-muted disabled:cursor-default"
        >
          {project?.name ?? 'No project'}
        </button>
      )}

      <div className="w-px h-4 bg-editor-border" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Tooltip text="Undo (Ctrl+Z)">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={cn(
              'p-1 rounded transition-colors',
              canUndo
                ? 'text-editor-text hover:text-white hover:bg-editor-hover'
                : 'text-editor-muted cursor-not-allowed'
            )}
          >
            <Undo2 size={14} />
          </button>
        </Tooltip>

        <Tooltip text="Redo (Ctrl+Y)">
          <button
            onClick={redo}
            disabled={!canRedo}
            className={cn(
              'p-1 rounded transition-colors',
              canRedo
                ? 'text-editor-text hover:text-white hover:bg-editor-hover'
                : 'text-editor-muted cursor-not-allowed'
            )}
          >
            <Redo2 size={14} />
          </button>
        </Tooltip>
      </div>

      <div className="w-px h-4 bg-editor-border" />

      {/* Canvas size */}
      <div className="relative">
        <button
          disabled={!project}
          onClick={() => setSizeOpen(v => !v)}
          className="flex items-center gap-1 text-xs text-editor-secondary hover:text-editor-text px-2 py-1 rounded hover:bg-editor-hover transition-colors disabled:text-editor-muted disabled:cursor-default"
        >
          <Monitor size={12} />
          <span>{sizeLabel}</span>
          {project && <ChevronDown size={10} />}
        </button>

        {sizeOpen && project && (
          <div className="absolute top-full left-0 mt-1 bg-editor-elevated border border-editor-border rounded shadow-lg z-50 min-w-[170px]">
            {CANVAS_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { setCanvasSize(p.width, p.height); setSizeOpen(false) }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs hover:bg-editor-hover transition-colors flex items-center justify-between',
                  p.width === project.width && p.height === project.height
                    ? 'text-editor-accent' : 'text-editor-secondary'
                )}
              >
                <span>{p.label}</span>
                <span className="text-editor-muted">{p.width}×{p.height}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Background shortcut */}
      <button
        disabled={!project}
        onClick={() => setActivePanel('background')}
        className="text-xs text-editor-secondary hover:text-editor-text px-2 py-1 rounded hover:bg-editor-hover transition-colors disabled:text-editor-muted disabled:cursor-default"
      >
        Background
      </button>

      <div className="flex-1" />

      {/* Preview */}
      <Tooltip text="Preview video (Ctrl+P)">
        <button
          disabled={!project}
          onClick={() => setPreviewOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-editor-hover text-editor-text hover:bg-editor-border transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          <Play size={11} />
          Preview
        </button>
      </Tooltip>

      {/* Export */}
      <Tooltip text="Export video (Ctrl+E)">
        <button
          disabled={!project}
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-editor-accent text-white hover:bg-editor-accent-hover transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          <Download size={11} />
          Export Video
        </button>
      </Tooltip>
    </div>
  )
}
