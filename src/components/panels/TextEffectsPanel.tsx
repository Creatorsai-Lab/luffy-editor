import { Sparkles } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { TextElement, TextEffectType } from '../../types/editor'
import { PanelHeader } from './TextPanel'
import { cn } from '../../utils/cn'

const TEXT_EFFECTS: { label: string; value: TextEffectType; description: string }[] = [
  { label: 'Shadow',  value: 'shadow',  description: 'Drop shadow effect' },
  { label: 'Glow',    value: 'glow',    description: 'Glowing outline' },
  { label: 'Outline', value: 'outline', description: 'Text outline' },
  { label: 'Hollow',  value: 'hollow',  description: 'Hollow text' },
  { label: 'Glitch',  value: 'glitch',  description: 'Glitch effect' },
  { label: 'Bubble',  value: 'bubble',  description: 'Bubble text' },
]

export default function TextEffectsPanel() {
  const { getSelectedEls, updateElement } = useEditorStore()
  const els = getSelectedEls().filter(e => e.type === 'text')
  const el  = els[0] as TextElement | undefined

  function toggleEffect(effect: TextEffectType) {
    if (!el) return
    const effects = el.effects || []
    const hasEffect = effects.includes(effect)
    
    if (hasEffect) {
      updateElement(el.id, { effects: effects.filter(e => e !== effect) })
    } else {
      updateElement(el.id, { effects: [...effects, effect] })
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader icon={<Sparkles size={12} />} title="Text Effects" />

      <div className="flex-1 overflow-y-auto">
        {!el && (
          <p className="text-xs text-[#c1c1c1] px-3 py-3">
            Select a text element to add effects.
          </p>
        )}

        {el && (
          <div className="flex flex-col gap-0 px-3 py-2">
            <p className="text-xs text-[#c1c1c1] mb-2">
              Click to toggle effects on/off
            </p>

            <div className="grid grid-cols-2 gap-2">
              {TEXT_EFFECTS.map(effect => {
                const isActive = (el.effects || []).includes(effect.value)
                
                return (
                  <button
                    key={effect.value}
                    onClick={() => toggleEffect(effect.value)}
                    className={cn(
                      'flex flex-col items-start gap-1 p-3 rounded-lg border-2 transition-all text-left',
                      isActive
                        ? 'bg-editor-accent-dim border-editor-accent'
                        : 'bg-editor-elevated border-editor-border hover:border-editor-border-strong'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={cn(
                        'text-xs font-medium',
                        isActive ? 'text-editor-accent' : 'text-editor-text'
                      )}>
                        {effect.label}
                      </span>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-editor-accent" />
                      )}
                    </div>
                    <span className="text-2xs text-[#c1c1c1]">
                      {effect.description}
                    </span>
                  </button>
                )
              })}
            </div>

            {(el.effects && el.effects.length > 0) && (
              <div className="mt-3 p-2 bg-editor-accent-dim rounded text-xs text-editor-accent">
                <strong>Active:</strong> {el.effects.join(', ')}
              </div>
            )}

            <div className="mt-3 p-2 bg-editor-elevated rounded text-2xs text-[#c1c1c1]">
              <strong>Note:</strong> Effects are visual enhancements. Some effects may require additional rendering implementation.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
