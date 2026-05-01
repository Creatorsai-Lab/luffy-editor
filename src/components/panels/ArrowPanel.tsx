import { ArrowRight } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ArrowElement, ArrowHeadType } from '../../types/editor'
import { PanelHeader, Row, ColorInput, Slider } from './TextPanel'
import { cn } from '../../utils/cn'

const HEADS: { label: string; value: ArrowHeadType }[] = [
  { label: 'None',  value: 'none' },
  { label: '→',     value: 'end' },
  { label: '←',     value: 'start' },
  { label: '↔',     value: 'both' }
]

export default function ArrowPanel() {
  const { getSelectedEls, updateElement, setActiveTool } = useEditorStore()
  const el = getSelectedEls().find(e => e.type === 'arrow') as ArrowElement | undefined

  function upd(patch: Partial<ArrowElement>) {
    if (el) updateElement(el.id, patch)
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <PanelHeader icon={<ArrowRight size={12} />} title="Arrow / Line" />

      <div className="px-3 py-2 border-b border-editor-border">
        <button
          onClick={() => setActiveTool('arrow')}
          className="text-xs px-3 py-1.5 bg-editor-accent-dim text-editor-accent border border-editor-accent rounded hover:bg-editor-accent hover:text-white transition-colors"
        >
          Draw Arrow
        </button>
        <p className="text-xs text-editor-muted mt-1.5">Click-drag on canvas to draw.</p>
      </div>

      {el && (
        <div className="flex flex-col px-3 py-2 gap-0.5">
          <Row label="Arrowhead">
            <div className="flex gap-1">
              {HEADS.map(h => (
                <button
                  key={h.value}
                  onClick={() => upd({ arrowHead: h.value })}
                  className={cn(
                    'flex-1 py-1 text-xs rounded border transition-colors',
                    el.arrowHead === h.value
                      ? 'bg-editor-accent-dim border-editor-accent text-editor-accent'
                      : 'bg-editor-elevated border-editor-border text-editor-muted hover:text-editor-text'
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Color">
            <ColorInput value={el.stroke} onChange={v => upd({ stroke: v })} />
          </Row>
          <Row label="Width">
            <Slider value={el.strokeWidth} min={1} max={20} step={0.5}
              onChange={v => upd({ strokeWidth: v })} display={`${el.strokeWidth}px`} />
          </Row>
          <Row label="Dashed">
            <button
              onClick={() => upd({ dashed: !el.dashed })}
              className={cn(
                'text-xs px-3 py-1 rounded border transition-colors',
                el.dashed
                  ? 'bg-editor-accent-dim border-editor-accent text-editor-accent'
                  : 'bg-editor-elevated border-editor-border text-editor-muted hover:text-editor-text'
              )}
            >
              {el.dashed ? 'Dashed ✓' : 'Solid'}
            </button>
          </Row>
          <Row label="Opacity">
            <Slider value={el.opacity} min={0} max={1} step={0.01}
              onChange={v => upd({ opacity: v })} display={`${Math.round(el.opacity * 100)}%`} />
          </Row>
        </div>
      )}
    </div>
  )
}
