import { Shuffle } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { TransitionType, SlideDir } from '../../types/editor'
import { PanelHeader, Row, Slider } from './TextPanel'
import { cn } from '../../utils/cn'

const TRANSITIONS: { label: string; value: TransitionType; desc: string }[] = [
  { label: 'None',  value: 'none',  desc: 'Cut directly' },
  { label: 'Fade',  value: 'fade',  desc: 'Fade from black' },
  { label: 'Slide', value: 'slide', desc: 'Slide in from edge' },
  { label: 'Push',  value: 'push',  desc: 'Push from edge' },
  { label: 'Zoom',  value: 'zoom',  desc: 'Zoom in from center' },
  { label: 'Wipe',  value: 'wipe',  desc: 'Curtain wipe reveal' },
  { label: 'Morph', value: 'morph', desc: 'Fade + scale in' },
]

const HAS_DIRECTION: TransitionType[] = ['slide', 'push']

export default function TransitionPanel() {
  const { project, currentSceneId, setTransition } = useEditorStore()
  const scene = project?.scenes.find(s => s.id === currentSceneId)

  if (!scene) return null

  const tr = scene.transition
  const hasDir = HAS_DIRECTION.includes(tr.type)

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <PanelHeader icon={<Shuffle size={12} />} title="Scene Transition" />

      <div className="flex flex-col px-3 py-2 gap-2">
        <p className="text-xs text-editor-muted">
          Applied when this scene enters.
        </p>

        {/* Transition type grid */}
        <div className="grid grid-cols-2 gap-1">
          {TRANSITIONS.map(t => (
            <button
              key={t.value}
              onClick={() => setTransition(scene.id, { ...tr, type: t.value })}
              title={t.desc}
              className={cn(
                'text-xs px-2.5 py-2 rounded border transition-colors text-left',
                tr.type === t.value
                  ? 'bg-editor-accent-dim border-editor-accent text-editor-accent'
                  : 'bg-editor-elevated border-editor-border text-editor-muted hover:text-editor-text hover:border-editor-border-strong'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tr.type !== 'none' && (
          <>
            <Row label="Duration">
              <Slider value={tr.duration} min={0.1} max={2} step={0.1}
                onChange={v => setTransition(scene.id, { ...tr, duration: v })}
                display={`${tr.duration.toFixed(1)}s`} />
            </Row>

            {hasDir && (
              <Row label="Direction">
                <select
                  value={tr.direction ?? 'right'}
                  onChange={e => setTransition(scene.id, { ...tr, direction: e.target.value as SlideDir })}
                  className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
                >
                  <option value="right">From Right →</option>
                  <option value="left">From Left ←</option>
                  <option value="down">From Bottom ↓</option>
                  <option value="up">From Top ↑</option>
                </select>
              </Row>
            )}

            <p className="text-2xs text-editor-muted bg-editor-elevated rounded px-2 py-1.5">
              {TRANSITIONS.find(t => t.value === tr.type)?.desc}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
