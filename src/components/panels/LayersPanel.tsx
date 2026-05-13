import { Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Layers, Trash2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { cn } from '../../utils/cn'

export default function LayersPanel() {
  const {
    project, currentSceneId, selectedIds,
    selectElement, updateElement, removeElement,
    bringForward, sendBackward
  } = useEditorStore()

  const scene = project?.scenes.find(s => s.id === currentSceneId)
  if (!scene) return null

  const sorted = [...scene.elements].sort((a, b) => b.zIndex - a.zIndex)

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-editor-border">
        <Layers size={12} className="text-editor-accent" />
        <span className="text-xs font-medium text-editor-text">Layers</span>
        <span className="text-xs text-[#c1c1c1] ml-auto">{scene.elements.length}</span>
      </div>

      {sorted.length === 0 && (
        <p className="text-xs text-[#c1c1c1] px-3 py-4 text-center">No elements in this scene.</p>
      )}

      {sorted.map(el => {
        const isSelected = selectedIds.includes(el.id)
        return (
          <div
            key={el.id}
            onClick={() => selectElement(el.id)}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-2 cursor-pointer border-b border-editor-border transition-colors',
              isSelected ? 'bg-editor-accent-dim' : 'hover:bg-editor-hover'
            )}
          >
            {/* Type indicator */}
            <span className={cn(
              'text-xs font-mono w-4 text-center flex-none',
              isSelected ? 'text-editor-accent' : 'text-[#c1c1c1]'
            )}>
              {el.type[0].toUpperCase()}
            </span>

            {/* Name */}
            <span className={cn(
              'flex-1 text-xs truncate',
              isSelected ? 'text-editor-accent' : 'text-editor-secondary'
            )}>
              {el.name}
            </span>

            {/* Controls */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={e => { e.stopPropagation(); bringForward(el.id) }}
                className="text-[#c1c1c1] hover:text-editor-text p-0.5"
                title="Bring forward"
              >
                <ArrowUp size={10} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); sendBackward(el.id) }}
                className="text-[#c1c1c1] hover:text-editor-text p-0.5"
                title="Send backward"
              >
                <ArrowDown size={10} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }) }}
                className="text-[#c1c1c1] hover:text-editor-text p-0.5"
                title={el.visible ? 'Hide' : 'Show'}
              >
                {el.visible ? <Eye size={10} /> : <EyeOff size={10} />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }) }}
                className="text-[#c1c1c1] hover:text-editor-text p-0.5"
                title={el.locked ? 'Unlock' : 'Lock'}
              >
                {el.locked ? <Lock size={10} /> : <Unlock size={10} />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); removeElement(el.id) }}
                className="text-[#c1c1c1] hover:text-red-400 p-0.5"
                title="Delete"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
