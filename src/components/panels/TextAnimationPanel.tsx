import { Plus, Trash2, Type } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { AnimationType, EasingType, AnimationTiming, ElementAnimation } from '../../types/editor'
import { makeAnimation } from '../../utils/defaults'
import { PanelHeader, Row, Slider } from './TextPanel'
import { cn } from '../../utils/cn'

const TEXT_ANIM_TYPES: { label: string; value: AnimationType; timing: AnimationTiming }[] = [
  // On Enter
  { label: 'Typewriter (Chars)', value: 'typewriterChars', timing: 'onEnter' },
  { label: 'Typewriter (Words)', value: 'typewriterWords', timing: 'onEnter' },
  { label: 'Fade In',            value: 'textFade',        timing: 'onEnter' },
  { label: 'Burst',              value: 'textBurst',       timing: 'onEnter' },
  { label: 'Bounce',             value: 'textBounce',      timing: 'onEnter' },
  { label: 'Block',              value: 'textBlock',       timing: 'onEnter' },
  { label: 'Squiz In',           value: 'textSquiz',       timing: 'onEnter' },
  { label: 'Spread',             value: 'textSpread',      timing: 'onEnter' },
  { label: 'Twirl',              value: 'textTwirl',       timing: 'onEnter' },
  { label: 'Zoom In',            value: 'textZoomIn',      timing: 'onEnter' },
  
  // On Exit
  { label: 'Fade Out',           value: 'textFade',        timing: 'onExit' },
  { label: 'Zoom Out',           value: 'textZoomOut',     timing: 'onExit' },
  
  // Loop
  { label: 'Pulse (Loop)',       value: 'pulse',           timing: 'loop' },
  { label: 'Bounce (Loop)',      value: 'bounceLoop',      timing: 'loop' },
]

const EASINGS: { label: string; value: EasingType }[] = [
  { label: 'Linear',    value: 'linear' },
  { label: 'Ease In',   value: 'easeIn' },
  { label: 'Ease Out',  value: 'easeOut' },
  { label: 'Ease InOut',value: 'easeInOut' },
  { label: 'Bounce',    value: 'bounce' }
]

export default function TextAnimationPanel() {
  const { getSelectedEls, addAnimation, updateAnimation, removeAnimation } = useEditorStore()
  const els = getSelectedEls().filter(e => e.type === 'text')
  const el  = els[0]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader icon={<Type size={12} />} title="Text Animations" />

      <div className="flex-1 overflow-y-auto">
        {!el && (
          <p className="text-xs text-editor-muted px-3 py-3">
            Select a text element to add animations.
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
                <Plus size={11} /> Add Text Animation
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

  const isLoop = anim.timing === 'loop'

  return (
    <div className="border-b border-editor-border px-3 py-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-editor-secondary font-medium">Animation {index + 1}</span>
        <button onClick={() => removeAnimation(elId, anim.id)} className="text-editor-muted hover:text-red-400">
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
                  : 'bg-editor-elevated text-editor-muted hover:text-editor-text'
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
          {TEXT_ANIM_TYPES.filter(t => t.timing === anim.timing).map(t =>
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
