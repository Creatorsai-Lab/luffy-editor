import { useState } from 'react'
import { Play, Download, ChevronDown, Monitor, Smartphone, Square } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { CANVAS_PRESETS } from '../../types/editor'
import { cn } from '../../utils/cn'

export default function TopBar() {
  const {
    project, currentSceneId,
    setProjectName, setCanvasSize, setActivePanel,
    setPreviewOpen, setExportOpen
  } = useEditorStore()

  const [editingName, setEditingName] = useState(false)
  const [sizeOpen, setSizeOpen]       = useState(false)
  const [bgOpen, setBgOpen]           = useState(false)

  if (!project) return (
    <div className="h-10 bg-editor-panel border-b border-editor-border flex items-center px-4">
      <span className="text-xs text-editor-muted">No project open</span>
    </div>
  )

  const preset = CANVAS_PRESETS.find(p => p.width === project.width && p.height === project.height)

  return (
    <div className="h-10 bg-editor-panel border-b border-editor-border flex items-center gap-3 px-4 flex-none nodrag">
      {/* Project name */}
      {editingName ? (
        <input
          autoFocus
          className="bg-editor-elevated border border-editor-accent text-editor-text text-xs px-2 py-0.5 rounded w-36"
          defaultValue={project.name}
          onBlur={e => { setProjectName(e.target.value); setEditingName(false) }}
          onKeyDown={e => { if (e.key === 'Enter') { setProjectName(e.currentTarget.value); setEditingName(false) } }}
        />
      ) : (
        <button
          onClick={() => setEditingName(true)}
          className="text-xs text-editor-text hover:text-white px-1.5 py-0.5 rounded hover:bg-editor-hover transition-colors max-w-[140px] truncate"
        >
          {project.name}
        </button>
      )}

      <div className="w-px h-4 bg-editor-border" />

      {/* Canvas size */}
      <div className="relative">
        <button
          onClick={() => setSizeOpen(v => !v)}
          className="flex items-center gap-1 text-xs text-editor-secondary hover:text-editor-text px-2 py-1 rounded hover:bg-editor-hover transition-colors"
        >
          <Monitor size={12} />
          <span>{preset?.label ?? `${project.width}×${project.height}`}</span>
          <ChevronDown size={10} />
        </button>
        {sizeOpen && (
          <div className="absolute top-full left-0 mt-1 bg-editor-elevated border border-editor-border rounded shadow-lg z-50 min-w-[160px]">
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
        onClick={() => { setActivePanel('background'); setBgOpen(false) }}
        className="text-xs text-editor-secondary hover:text-editor-text px-2 py-1 rounded hover:bg-editor-hover transition-colors"
      >
        Background
      </button>

      <div className="flex-1" />

      {/* Preview */}
      <button
        onClick={() => setPreviewOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-editor-hover text-editor-text hover:bg-editor-border transition-colors"
      >
        <Play size={11} />
        Preview
      </button>

      {/* Export */}
      <button
        onClick={() => setExportOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-editor-accent text-white hover:bg-editor-accent-hover transition-colors"
      >
        <Download size={11} />
        Export MP4
      </button>
    </div>
  )
}
