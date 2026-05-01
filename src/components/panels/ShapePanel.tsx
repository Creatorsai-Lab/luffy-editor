import { Square, Circle, Triangle, Star } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ShapeElement, ShapeType } from '../../types/editor'
import { PanelHeader, Row, ColorInput, Slider, NumberInput } from './TextPanel'
import { cn } from '../../utils/cn'

const SHAPES: { icon: React.ReactNode; type: ShapeType }[] = [
  { icon: <Square size={14} />,   type: 'rect' },
  { icon: <Circle size={14} />,   type: 'circle' },
  { icon: <Triangle size={14} />, type: 'triangle' },
  { icon: <Star size={14} />,     type: 'star' }
]

export default function ShapePanel() {
  const { getSelectedEls, updateElement, setActiveTool } = useEditorStore()
  const el = getSelectedEls().find(e => e.type === 'shape') as ShapeElement | undefined

  function upd(patch: Partial<ShapeElement>) {
    if (el) updateElement(el.id, patch)
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <PanelHeader icon={<Square size={12} />} title="Shape" />

      {/* Shape picker */}
      <div className="px-3 py-2 border-b border-editor-border">
        <span className="label block mb-1.5">Add Shape</span>
        <div className="flex gap-1">
          {SHAPES.map(s => (
            <button
              key={s.type}
              onClick={() => setActiveTool(`shape-${s.type}` as 'shape-rect')}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded border transition-colors',
                el?.shapeType === s.type
                  ? 'bg-editor-accent-dim border-editor-accent text-editor-accent'
                  : 'bg-editor-elevated border-editor-border text-editor-muted hover:text-editor-text'
              )}
            >
              {s.icon}
            </button>
          ))}
        </div>
      </div>

      {el && (
        <div className="flex flex-col px-3 py-2 gap-0.5">
          <Row label="Fill">
            <ColorInput value={el.fill} onChange={v => upd({ fill: v })} />
          </Row>
          <Row label="Stroke">
            <ColorInput value={el.stroke} onChange={v => upd({ stroke: v })} />
          </Row>
          <Row label="Stroke Width">
            <Slider value={el.strokeWidth} min={0} max={20} step={0.5}
              onChange={v => upd({ strokeWidth: v })} display={`${el.strokeWidth}px`} />
          </Row>
          {el.shapeType === 'rect' && (
            <Row label="Corner Radius">
              <Slider value={el.cornerRadius} min={0} max={100} step={1}
                onChange={v => upd({ cornerRadius: v })} display={`${el.cornerRadius}px`} />
            </Row>
          )}
          <Row label="Opacity">
            <Slider value={el.opacity} min={0} max={1} step={0.01}
              onChange={v => upd({ opacity: v })} display={`${Math.round(el.opacity * 100)}%`} />
          </Row>
          <Row label="Width">
            <NumberInput value={Math.round(el.width)} min={4} max={4000} onChange={v => upd({ width: v })} />
          </Row>
          <Row label="Height">
            <NumberInput value={Math.round(el.height)} min={4} max={4000} onChange={v => upd({ height: v })} />
          </Row>
        </div>
      )}

      {!el && (
        <p className="text-xs text-editor-muted px-3 py-3">
          Click a shape above, then click the canvas to place it.
        </p>
      )}
    </div>
  )
}
