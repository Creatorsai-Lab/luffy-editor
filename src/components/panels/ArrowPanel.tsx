import { ArrowRight, Plus, Trash2, Zap } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ArrowElement, ArrowHeadType, AnimationType, EasingType, SlideDir, AnimationTiming, ElementAnimation } from '../../types/editor'
import { PanelHeader, Row, ColorInput, Slider, NumberInput } from './TextPanel'
import { makeAnimation } from '../../utils/defaults'
import { cn } from '../../utils/cn'

const HEADS: { label: string; value: ArrowHeadType }[] = [
  { label: 'None', value: 'none' },
  { label: '→',    value: 'end' },
  { label: '←',    value: 'start' },
  { label: '↔',    value: 'both' }
]

const ENTER_ANIMS: { label: string; value: AnimationType }[] = [
  { label: 'Draw On',    value: 'drawPath' },
  { label: 'Slide In',   value: 'slideIn' },
  { label: 'Fade In',    value: 'fadeIn' },
  { label: 'Zoom In',    value: 'scaleIn' },
]

const LOOP_ANIMS: { label: string; value: AnimationType }[] = [
  { label: 'Pulse',       value: 'pulse' },
  { label: 'Flow',        value: 'flowLoop' },
  { label: 'Fade Loop',   value: 'fadeLoop' },
]

const EXIT_ANIMS: { label: string; value: AnimationType }[] = [
  { label: 'Draw Off',   value: 'drawOff' },
  { label: 'Slide Out',  value: 'slideOut' },
  { label: 'Fade Out',   value: 'fadeOut' },
  { label: 'Zoom Out',   value: 'scaleOut' },
]

const EASINGS: { label: string; value: EasingType }[] = [
  { label: 'Linear',    value: 'linear' },
  { label: 'Ease In',   value: 'easeIn' },
  { label: 'Ease Out',  value: 'easeOut' },
  { label: 'Ease InOut',value: 'easeInOut' },
  { label: 'Bounce',    value: 'bounce' }
]

const DIRECTIONS: { label: string; value: SlideDir }[] = [
  { label: '← Left',  value: 'left' },
  { label: '→ Right', value: 'right' },
  { label: '↑ Up',    value: 'up' },
  { label: '↓ Down',  value: 'down' }
]

function animsByTiming(timing: AnimationTiming) {
  if (timing === 'onEnter') return ENTER_ANIMS
  if (timing === 'loop')    return LOOP_ANIMS
  return EXIT_ANIMS
}

export default function ArrowPanel() {
  const { getSelectedEls, updateElement, addAnimation, setActiveTool } = useEditorStore()
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

      {/* Draw button */}
      <div className="px-3 py-2 border-b border-editor-border">
        <button
          onClick={() => setActiveTool('arrow')}
          className="text-xs px-3 py-1.5 bg-editor-accent-dim text-editor-accent border border-editor-accent rounded hover:bg-editor-accent hover:text-white transition-colors"
        >
          Draw Arrow
        </button>
        <p className="text-xs text-[#c1c1c1] mt-1.5">Click-drag on canvas to draw.</p>
      </div>

      {/* Properties */}
      {el && (
        <div className="flex flex-col px-3 py-2 gap-0.5">
          <Row label="Arrowhead">
            <div className="flex gap-1">
              {HEADS.map(h => (
                <button key={h.value} onClick={() => upd({ arrowHead: h.value })}
                  className={cn('flex-1 py-1 text-xs rounded border transition-colors',
                    el.arrowHead === h.value
                      ? 'bg-editor-accent-dim border-editor-accent text-editor-accent'
                      : 'bg-editor-elevated border-editor-border text-[#c1c1c1] hover:text-editor-text'
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
                      : 'bg-editor-elevated border-editor-border text-[#c1c1c1] hover:text-editor-text'
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
              <span className="text-xs text-[#c1c1c1]">°</span>
              <button onClick={() => applyAngle(currentAngle + 90)}
                className="text-xs px-2 py-1 bg-editor-elevated border border-editor-border rounded text-[#c1c1c1] hover:text-editor-text transition-colors">
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

      {/* ── Animations section ─────────────────────────────────────────────── */}
      {el && (
        <div className="border-t border-editor-border mt-1">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap size={11} className="text-editor-accent" />
              <span className="text-[10px] font-semibold text-[#c1c1c1] uppercase tracking-wider">Animations</span>
            </div>
            <button
              onClick={() => addAnimation(el.id, { ...makeAnimation(), type: 'drawPath', timing: 'onEnter' })}
              className="flex items-center gap-1 text-[10px] px-2 py-1 bg-editor-accent-dim text-editor-accent border border-editor-accent rounded hover:bg-editor-accent hover:text-white transition-colors"
            >
              <Plus size={9} /> Add
            </button>
          </div>

          {el.animations.length === 0 && (
            <p className="text-[10px] text-[#c1c1c1] px-3 pb-3">No animations — click Add to create one.</p>
          )}

          {el.animations.map((anim, i) => (
            <AnimBlock key={anim.id} anim={anim} index={i} elId={el.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function AnimBlock({ anim, index, elId }: {
  anim: ElementAnimation; index: number; elId: string
}) {
  const { updateAnimation, removeAnimation } = useEditorStore()

  function upd(patch: Partial<ElementAnimation>) {
    updateAnimation(elId, anim.id, patch)
  }

  const isLoop = anim.timing === 'loop'
  const hasDir = anim.type === 'slideIn' || anim.type === 'slideOut'

  return (
    <div className="border-b border-editor-border px-3 py-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-editor-secondary font-medium">Animation {index + 1}</span>
        <button onClick={() => removeAnimation(elId, anim.id)} className="text-[#c1c1c1] hover:text-red-400 transition-colors">
          <Trash2 size={10} />
        </button>
      </div>

      <Row label="Timing">
        <div className="flex gap-1">
          {(['onEnter', 'loop', 'onExit'] as AnimationTiming[]).map(t => (
            <button
              key={t}
              onClick={() => {
                const newType = animsByTiming(t)[0].value
                upd({ timing: t, type: newType })
              }}
              className={cn(
                'flex-1 text-[10px] px-1.5 py-1 rounded transition-colors',
                anim.timing === t
                  ? 'bg-editor-accent text-white'
                  : 'bg-editor-elevated text-[#c1c1c1] hover:text-editor-text'
              )}
            >
              {t === 'onEnter' ? 'Enter' : t === 'onExit' ? 'Exit' : 'Loop'}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Type">
        <select
          value={anim.type}
          onChange={e => upd({ type: e.target.value as AnimationType })}
          className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
        >
          {animsByTiming(anim.timing).map(t =>
            <option key={t.value} value={t.value}>{t.label}</option>
          )}
        </select>
      </Row>

      {isLoop && (
        <div className="text-[10px] text-editor-accent bg-editor-accent-dim rounded px-2 py-0.5 w-fit">
          ∞ Loops continuously
        </div>
      )}

      {hasDir && (
        <Row label="Direction">
          <select
            value={anim.params?.direction ?? 'left'}
            onChange={e => upd({ params: { ...anim.params, direction: e.target.value as SlideDir } })}
            className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
          >
            {DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </Row>
      )}

      <Row label="Start (s)">
        <input
          type="number" min={0} max={60} step={0.1}
          value={anim.startTime}
          onChange={e => upd({ startTime: Number(e.target.value) })}
          className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1 nodrag"
        />
      </Row>

      <Row label={isLoop ? 'Period (s)' : 'Duration (s)'}>
        <input
          type="number" min={0.1} max={30} step={0.1}
          value={anim.duration}
          onChange={e => upd({ duration: Number(e.target.value) })}
          className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1 nodrag"
        />
      </Row>

      <Row label="Delay (s)">
        <input
          type="number" min={0} max={30} step={0.1}
          value={anim.delay}
          onChange={e => upd({ delay: Number(e.target.value) })}
          className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1 nodrag"
        />
      </Row>

      {!isLoop && (
        <Row label="Easing">
          <select
            value={anim.easing}
            onChange={e => upd({ easing: e.target.value as EasingType })}
            className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
          >
            {EASINGS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </Row>
      )}
    </div>
  )
}
