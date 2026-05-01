import { Plus, Trash2, Sparkles } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { AnimationType, EasingType, SlideDir, ElementAnimation } from '../../types/editor'
import { makeAnimation } from '../../utils/defaults'
import { PanelHeader, Row, Slider } from './TextPanel'
import { cn } from '../../utils/cn'

const ANIM_TYPES: { label: string; value: AnimationType }[] = [
  { label: 'Fade In',      value: 'fadeIn' },
  { label: 'Fade Out',     value: 'fadeOut' },
  { label: 'Slide In',     value: 'slideIn' },
  { label: 'Slide Out',    value: 'slideOut' },
  { label: 'Scale In',     value: 'scaleIn' },
  { label: 'Scale Out',    value: 'scaleOut' },
  { label: 'Typewriter',   value: 'typewriter' },
  { label: 'Spin',         value: 'spin' }
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

export default function AnimationPanel() {
  const { getSelectedEls, addAnimation, updateAnimation, removeAnimation } = useEditorStore()
  const els = getSelectedEls()
  const el  = els[0]

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <PanelHeader icon={<Sparkles size={12} />} title="Animations" />

      {!el && (
        <p className="text-xs text-editor-muted px-3 py-3">
          Select an element to add animations.
        </p>
      )}

      {el && (
        <div className="flex flex-col gap-0">
          {/* Add button */}
          <div className="px-3 py-2 border-b border-editor-border">
            <button
              onClick={() => addAnimation(el.id, makeAnimation())}
              className="flex items-center gap-1.5 w-full text-xs py-1.5 px-3 bg-editor-accent-dim text-editor-accent border border-editor-accent rounded hover:bg-editor-accent hover:text-white transition-colors"
            >
              <Plus size={11} /> Add Animation
            </button>
          </div>

          {/* Animation list */}
          {el.animations.length === 0 && (
            <p className="text-xs text-editor-muted px-3 py-3">No animations yet.</p>
          )}

          {el.animations.map((anim, i) => (
            <AnimBlock
              key={anim.id}
              anim={anim}
              index={i}
              elId={el.id}
              elType={el.type}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AnimBlock({ anim, index, elId, elType }: {
  anim: ElementAnimation; index: number; elId: string; elType: string
}) {
  const { updateAnimation, removeAnimation } = useEditorStore()

  function upd(patch: Partial<ElementAnimation>) {
    updateAnimation(elId, anim.id, patch)
  }

  const hasDir = anim.type === 'slideIn' || anim.type === 'slideOut'
  const textOnly = anim.type === 'typewriter'

  if (textOnly && elType !== 'text') return null

  return (
    <div className="border-b border-editor-border px-3 py-2 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-editor-secondary font-medium">Anim {index + 1}</span>
        <button onClick={() => removeAnimation(elId, anim.id)} className="text-editor-muted hover:text-red-400">
          <Trash2 size={11} />
        </button>
      </div>

      {/* Type */}
      <select
        value={anim.type}
        onChange={e => upd({ type: e.target.value as AnimationType })}
        className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
      >
        {ANIM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      {/* Direction */}
      {hasDir && (
        <select
          value={anim.params?.direction ?? 'left'}
          onChange={e => upd({ params: { ...anim.params, direction: e.target.value as SlideDir } })}
          className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
        >
          {DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      )}

      {/* Timing */}
      <div className="flex gap-2">
        <div className="flex-1">
          <span className="label block">Start</span>
          <input
            type="number" min={0} max={60} step={0.1}
            value={anim.startTime}
            onChange={e => upd({ startTime: Number(e.target.value) })}
            className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1 nodrag"
          />
        </div>
        <div className="flex-1">
          <span className="label block">Duration</span>
          <input
            type="number" min={0.1} max={30} step={0.1}
            value={anim.duration}
            onChange={e => upd({ duration: Number(e.target.value) })}
            className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1 nodrag"
          />
        </div>
        <div className="flex-1">
          <span className="label block">Delay</span>
          <input
            type="number" min={0} max={30} step={0.1}
            value={anim.delay}
            onChange={e => upd({ delay: Number(e.target.value) })}
            className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1 nodrag"
          />
        </div>
      </div>

      {/* Easing */}
      <select
        value={anim.easing}
        onChange={e => upd({ easing: e.target.value as EasingType })}
        className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
      >
        {EASINGS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
      </select>
    </div>
  )
}
