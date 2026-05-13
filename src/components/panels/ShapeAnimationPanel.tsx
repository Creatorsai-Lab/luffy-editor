import { Plus, Trash2, Sparkles } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { AnimationType, EasingType, SlideDir, AnimationTiming, ElementAnimation } from '../../types/editor'
import { makeAnimation } from '../../utils/defaults'
import { PanelHeader, Row } from './TextPanel'
import { cn } from '../../utils/cn'

const SHAPE_ANIM_TYPES: { label: string; value: AnimationType; timing: AnimationTiming }[] = [
  // On Enter
  { label: 'Fade In',      value: 'fadeIn',      timing: 'onEnter' },
  { label: 'Slide In',     value: 'slideIn',     timing: 'onEnter' },
  { label: 'Scale In',     value: 'scaleIn',     timing: 'onEnter' },
  { label: 'Spin In',      value: 'spin',        timing: 'onEnter' },
  
  // On Exit
  { label: 'Fade Out',     value: 'fadeOut',     timing: 'onExit' },
  { label: 'Slide Out',    value: 'slideOut',    timing: 'onExit' },
  { label: 'Scale Out',    value: 'scaleOut',    timing: 'onExit' },
  
  // Loop
  { label: 'Pulse',        value: 'pulse',       timing: 'loop' },
  { label: 'Bounce',       value: 'bounceLoop',  timing: 'loop' },
  { label: 'Rotate',       value: 'rotateLoop',  timing: 'loop' },
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

export default function ShapeAnimationPanel() {
  const { getSelectedEls, addAnimation, updateAnimation, removeAnimation } = useEditorStore()
  const els = getSelectedEls().filter(e => e.type === 'shape' || e.type === 'arrow' || e.type === 'image')
  const el  = els[0]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader icon={<Sparkles size={12} />} title="Shape Animations" />

      <div className="flex-1 overflow-y-auto">
        {!el && (
          <p className="text-xs text-[#c1c1c1] px-3 py-3">
            Select a shape, arrow, or image to add animations.
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
                <Plus size={11} /> Add Shape Animation
              </button>
            </div>

            {/* Animation list */}
            {el.animations.length === 0 && (
              <p className="text-xs text-[#c1c1c1] px-3 py-3">No animations yet.</p>
            )}

            {el.animations.map((anim, i) => (
              <AnimBlock
                key={anim.id}
                anim={anim}
                index={i}
                elId={el.id}
              />
            ))}
          </div>
        )}
      </div>
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

  const hasDir  = anim.type === 'slideIn' || anim.type === 'slideOut'
  const isLoop  = anim.timing === 'loop'
  const hasDist = anim.type === 'bounceLoop'

  return (
    <div className="border-b border-editor-border px-3 py-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-editor-secondary font-medium">Animation {index + 1}</span>
        <button onClick={() => removeAnimation(elId, anim.id)} className="text-[#c1c1c1] hover:text-red-400">
          <Trash2 size={11} />
        </button>
      </div>

      {/* Timing */}
      <Row label="Timing">
        <div className="flex gap-1">
          {(['onEnter', 'onExit', 'loop'] as AnimationTiming[]).map(t => (
            <button
              key={t}
              onClick={() => upd({ timing: t })}
              className={cn(
                'flex-1 text-xs px-2 py-1.5 rounded transition-colors',
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

      {/* Type */}
      <Row label="Animation">
        <select
          value={anim.type}
          onChange={e => upd({ type: e.target.value as AnimationType })}
          className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
        >
          {SHAPE_ANIM_TYPES.filter(t => t.timing === anim.timing).map(t =>
            <option key={t.value + t.timing} value={t.value}>{t.label}</option>
          )}
        </select>
      </Row>

      {/* Loop badge */}
      {isLoop && (
        <div className="text-2xs text-editor-accent bg-editor-accent-dim rounded px-2 py-0.5 w-fit">
          ∞ Loops continuously
        </div>
      )}

      {/* Direction */}
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

      {/* Bounce distance */}
      {hasDist && (
        <Row label="Distance (px)">
          <input
            type="number" min={4} max={200} step={2}
            value={anim.params?.distance ?? 24}
            onChange={e => upd({ params: { ...anim.params, distance: Number(e.target.value) } })}
            className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1 nodrag"
          />
        </Row>
      )}

      {/* Timing controls */}
      <Row label="Start Time (s)">
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

      {/* Easing */}
      <Row label="Easing">
        <select
          value={anim.easing}
          onChange={e => upd({ easing: e.target.value as EasingType })}
          className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
        >
          {EASINGS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </Row>
    </div>
  )
}
