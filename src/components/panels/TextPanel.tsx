import { useEditorStore } from '../../store/editorStore'
import { FONT_FAMILIES } from '../../types/editor'
import type { TextElement, FontWeight, AlignType } from '../../types/editor'
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Type } from 'lucide-react'
import { cn } from '../../utils/cn'
import { makeText } from '../../utils/defaults'

const WEIGHTS: { label: string; value: FontWeight }[] = [
  { label: 'Normal',   value: 'normal' },
  { label: 'Medium',   value: 'medium' },
  { label: 'Semibold', value: 'semibold' },
  { label: 'Bold',     value: 'bold' }
]

export default function TextPanel() {
  const { getSelectedEls, updateElement, addElement, activeTool, currentSceneId } = useEditorStore()
  const selected = getSelectedEls()
  const el = selected.find(e => e.type === 'text') as TextElement | undefined

  function upd(patch: Partial<TextElement>) {
    if (el) updateElement(el.id, patch)
  }

  return (
    <div className="flex flex-col gap-0 overflow-y-auto flex-1">
      <PanelHeader icon={<Type size={12} />} title="Text" />

      {!el && (
        <p className="text-xs text-editor-muted px-3 py-3">
          Click <strong className="text-editor-secondary">Text</strong> in the menu then click the canvas to add a text block.
        </p>
      )}

      {el && (
        <div className="flex flex-col gap-0.5 px-3 py-2">
          {/* Content */}
          <Row label="Content">
            <textarea
              className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1.5 resize-none"
              rows={3}
              value={el.content}
              onChange={e => upd({ content: e.target.value })}
            />
          </Row>

          {/* Font family */}
          <Row label="Font">
            <select
              value={el.fontFamily}
              onChange={e => upd({ fontFamily: e.target.value })}
              className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
            >
              {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </Row>

          {/* Size */}
          <Row label="Size">
            <NumberInput value={el.fontSize} min={8} max={400} onChange={v => upd({ fontSize: v })} />
          </Row>

          {/* Weight */}
          <Row label="Weight">
            <select
              value={el.fontWeight}
              onChange={e => upd({ fontWeight: e.target.value as FontWeight })}
              className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
            >
              {WEIGHTS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
          </Row>

          {/* Style toggles */}
          <Row label="Style">
            <div className="flex gap-1">
              <ToggleBtn active={el.italic}    onClick={() => upd({ italic:    !el.italic    })}><Italic    size={11} /></ToggleBtn>
              <ToggleBtn active={el.underline} onClick={() => upd({ underline: !el.underline })}><Underline size={11} /></ToggleBtn>
            </div>
          </Row>

          {/* Alignment */}
          <Row label="Align">
            <div className="flex gap-1">
              {(['left','center','right'] as AlignType[]).map(a => (
                <ToggleBtn key={a} active={el.align === a} onClick={() => upd({ align: a })}>
                  {a === 'left' ? <AlignLeft size={11} /> : a === 'center' ? <AlignCenter size={11} /> : <AlignRight size={11} />}
                </ToggleBtn>
              ))}
            </div>
          </Row>

          {/* Color */}
          <Row label="Color">
            <ColorInput value={el.color} onChange={v => upd({ color: v })} />
          </Row>

          {/* Line height */}
          <Row label="Line Height">
            <Slider value={el.lineHeight} min={0.8} max={3} step={0.05}
              onChange={v => upd({ lineHeight: v })} display={el.lineHeight.toFixed(2)} />
          </Row>

          {/* Opacity */}
          <Row label="Opacity">
            <Slider value={el.opacity} min={0} max={1} step={0.01}
              onChange={v => upd({ opacity: v })} display={`${Math.round(el.opacity * 100)}%`} />
          </Row>

          <Row label="Stretch H">
            <Slider value={el.stretchX ?? 1} min={0.2} max={3} step={0.05}
              onChange={v => upd({ stretchX: v })} display={`${((el.stretchX ?? 1) * 100).toFixed(0)}%`} />
          </Row>

          <Row label="Stretch V">
            <Slider value={el.stretchY ?? 1} min={0.2} max={3} step={0.05}
              onChange={v => upd({ stretchY: v })} display={`${((el.stretchY ?? 1) * 100).toFixed(0)}%`} />
          </Row>

          <Row label="Border">
            <ColorInput value={el.textStroke || '#ffffff'} onChange={v => upd({ textStroke: v })} />
          </Row>

          <Row label="Border Width">
            <Slider value={el.textStrokeWidth ?? 0} min={0} max={10} step={0.5}
              onChange={v => upd({ textStrokeWidth: v })} display={`${el.textStrokeWidth ?? 0}px`} />
          </Row>

          <Row label="Shadow Color">
            <ColorInput value={el.shadowColor || '#000000'} onChange={v => upd({ shadowColor: v })} />
          </Row>

          <Row label="Shadow Blur">
            <Slider value={el.shadowBlur ?? 0} min={0} max={40} step={1}
              onChange={v => upd({ shadowBlur: v })} display={`${el.shadowBlur ?? 0}`} />
          </Row>

          <Row label="Shadow Offset">
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="label block">X</span>
                <NumberInput value={el.shadowOffsetX ?? 0} min={-50} max={50} onChange={v => upd({ shadowOffsetX: v })} />
              </div>
              <div className="flex-1">
                <span className="label block">Y</span>
                <NumberInput value={el.shadowOffsetY ?? 0} min={-50} max={50} onChange={v => upd({ shadowOffsetY: v })} />
              </div>
            </div>
          </Row>
        </div>
      )}
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────────

export function PanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-editor-border">
      <span className="text-editor-accent">{icon}</span>
      <span className="text-xs font-medium text-editor-text">{title}</span>
    </div>
  )
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <span className="label">{label}</span>
      {children}
    </div>
  )
}

export function NumberInput({ value, min, max, onChange, step = 1 }: {
  value: number; min: number; max: number; step?: number; onChange: (v: number) => void
}) {
  return (
    <input
      type="number" min={min} max={max} step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1 nodrag"
    />
  )
}

export function Slider({ value, min, max, step, onChange, display }: {
  value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-editor-accent h-1"
      />
      <span className="text-xs text-editor-muted w-9 text-right tabular-nums">{display}</span>
    </div>
  )
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color" value={value}
        onChange={e => onChange(e.target.value)}
        className="w-8 h-6 rounded cursor-pointer border border-editor-border"
      />
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1 nodrag"
        maxLength={9}
      />
    </div>
  )
}

function ToggleBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-7 h-7 rounded transition-colors',
        active ? 'bg-editor-accent text-white' : 'bg-editor-elevated text-editor-muted hover:text-editor-text'
      )}
    >
      {children}
    </button>
  )
}
