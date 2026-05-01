import { Minus, Square, X, Clapperboard } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { cn } from '../../utils/cn'

export default function Header() {
  const { project, isDirty } = useEditorStore()

  const minimize = () => window.api.win.minimize()
  const maximize = () => window.api.win.maximize()
  const close    = () => window.api.win.close()

  return (
    <header className="drag flex items-center justify-between h-8 bg-editor-surface border-b border-editor-border px-3 flex-none">
      {/* Logo + title */}
      <div className="nodrag flex items-center gap-2">
        <Clapperboard size={14} className="text-editor-accent" />
        <span className="text-xs font-medium text-editor-text">Luffy Editor</span>
        {project && (
          <>
            <span className="text-editor-border">›</span>
            <span className="text-xs text-editor-secondary">
              {project.name}{isDirty ? ' •' : ''}
            </span>
          </>
        )}
      </div>

      {/* Window controls */}
      <div className="nodrag flex items-center">
        <button
          onClick={minimize}
          className="flex items-center justify-center w-8 h-8 text-editor-muted hover:text-editor-text hover:bg-editor-hover transition-colors"
        >
          <Minus size={12} />
        </button>
        <button
          onClick={maximize}
          className="flex items-center justify-center w-8 h-8 text-editor-muted hover:text-editor-text hover:bg-editor-hover transition-colors"
        >
          <Square size={11} />
        </button>
        <button
          onClick={close}
          className="flex items-center justify-center w-8 h-8 text-editor-muted hover:text-white hover:bg-red-600 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </header>
  )
}
