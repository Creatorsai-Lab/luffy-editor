import { Focus } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { PanelHeader } from './TextPanel'

export default function PerspectivePanel() {
  const { getSelectedEls, updateElement } = useEditorStore()
  const el = getSelectedEls().find(e => e.type !== 'arrow' && e.type !== 'audio')

  function reset() {
    if (!el) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateElement(el.id, { perspectivePts: undefined } as any)
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <PanelHeader icon={<Focus size={12} />} title="Perspective" />

      <div className="px-3 py-3 flex flex-col gap-3">
        <p className="text-[10px] text-[#f2f2f2] leading-relaxed">
          Drag corner handles to distort the element. Edge handles move two corners simultaneously.
        </p>

        {!el && (
          <p className="text-[10px] text-[#d9d9d9]">Select an element to edit perspective.</p>
        )}

        {el && (
          <div className="flex flex-col gap-2">
            <div className="text-[10px] text-[#f2f2f2]">
              Element: <span className="text-editor-text">{el.name}</span>
            </div>

            {el.perspectivePts && (
              <div className="text-[10px] text-editor-accent bg-editor-accent-dim rounded px-2 py-1">
                Perspective active
              </div>
            )}

            <button
              onClick={reset}
              disabled={!el.perspectivePts}
              className="text-xs px-3 py-1.5 bg-editor-elevated border border-editor-border rounded text-[#f2f2f2] hover:text-editor-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reset Perspective
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
