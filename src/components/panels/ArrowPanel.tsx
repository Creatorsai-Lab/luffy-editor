import { ArrowRight } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ArrowElement, ArrowHeadType } from '../../types/editor'
import { PanelHeader, Row, ColorInput, Slider, NumberInput } from './TextPanel'
import { cn } from '../../utils/cn'

const HEADS: { label: string; value: ArrowHeadType }[] = [
  { label: 'None', value: 'none' },
  { label: '→',    value: 'end' },
  { label: '←',    value: 'start' },
  { label: '↔',    value: 'both' }
]

export default function ArrowPanel() {
  const { getSelectedEls, updateElement, setActiveTool } = useEditorStore()
  const el = getSelectedEls().find(e => e.type === 'arrow') as ArrowElement | undefined

  function upd(patch: Partial<ArrowElement>) {
    if (el) updateElement(el.id, patch)
  }

  function applyAngle(angleDeg: number) {
    if (!el) return
    const cx = (el.x1 + el.x2) / 2, cy = (el.y1 + el.y2) / 2
    const len = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2) / 2
    const rad = angleDeg * Math.PI / 180
    upd({
      x1: cx - Math.cos(rad) * len, y1: cy - Math.sin(rad) * len,
      x2: cx + Math.cos(rad) * len, y2: cy + Math.sin(rad) * len,
    })
  }

  const currentAngle = el
    ? Math.round(Math.atan2(el.y2 - el.y1, el.x2 - el.x1) * 180 / Math.PI)
    : 0

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
                <button key={h.value} onClick={() => upd({ arrowHead: h.value })}
                  className={cn('flex-1 py-1 text-xs rounded border transition-colors',
                    el.arrowHead === h.value
                      ? 'bg-editor-accent-dim border-editor-accent text-editor-accent'
                      : 'bg-editor-elevated border-editor-border text-editor-muted hover:text-editor-text'
                  )}>
                  {h.label}
                </button>
              ))}
            </div>
          </Row>

          <Row label="Head Size">
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="label block">Length</span>
                <NumberInput value={el.pointerLength ?? 12} min={4} max={60} onChange={v => upd({ pointerLength: v })} />
              </div>
              <div className="flex-1">
                <span className="label block">Width</span>
                <NumberInput value={el.pointerWidth ?? 10} min={4} max={60} onChange={v => upd({ pointerWidth: v })} />
              </div>
            </div>
          </Row>

          <Row label="Line Color">
            <ColorInput value={el.stroke} onChange={v => upd({ stroke: v })} />
          </Row>

          <Row label="Head Color">
            <ColorInput value={el.arrowHeadColor || el.stroke} onChange={v => upd({ arrowHeadColor: v })} />
          </Row>

          <Row label="Width">
            <Slider value={el.strokeWidth} min={1} max={20} step={0.5}
              onChange={v => upd({ strokeWidth: v })} display={`${el.strokeWidth}px`} />
          </Row>

          <Row label="Style">
            <div className="flex gap-1">
              {([['Solid', false, false], ['Dashed', true, false], ['Dotted', false, true]] as [string, boolean, boolean][]).map(([label, dashed, dotted]) => (
                <button key={label}
                  onClick={() => upd({ dashed, dotted })}
                  className={cn('flex-1 py-1 text-xs rounded border transition-colors',
                    el.dashed === dashed && el.dotted === dotted
                      ? 'bg-editor-accent-dim border-editor-accent text-editor-accent'
                      : 'bg-editor-elevated border-editor-border text-editor-muted hover:text-editor-text'
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </Row>

          <Row label="Curve">
            <Slider value={el.curve ?? 0} min={-300} max={300} step={5}
              onChange={v => upd({ curve: v })} display={`${el.curve ?? 0}`} />
          </Row>

          <Row label="Angle">
            <div className="flex items-center gap-2">
              <input type="number" min={-180} max={180} step={1}
                value={currentAngle}
                onChange={e => applyAngle(Number(e.target.value))}
                className="flex-1 bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1 nodrag"
              />
              <span className="text-xs text-editor-muted">°</span>
              <button onClick={() => applyAngle(currentAngle + 90)}
                className="text-xs px-2 py-1 bg-editor-elevated border border-editor-border rounded text-editor-muted hover:text-editor-text transition-colors">
                +90°
              </button>
            </div>
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
