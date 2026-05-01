import { Shuffle } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { TransitionType, SlideDir } from '../../types/editor'
import { PanelHeader, Row, Slider } from './TextPanel'
import { cn } from '../../utils/cn'

const TRANSITIONS: { label: string; value: TransitionType }[] = [
  { label: 'None',  value: 'none' },
  { label: 'Fade',  value: 'fade' },
  { label: 'Slide', value: 'slide' },
  { label: 'Zoom',  value: 'zoom' }
]

export default function TransitionPanel() {
  const { project, currentSceneId, setTransition } = useEditorStore()
  const scene = project?.scenes.find(s => s.id === currentSceneId)

  if (!scene) return null

  const tr = scene.transition

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <PanelHeader icon={<Shuffle size={12} />} title="Scene Transition" />

      <div className="flex flex-col px-3 py-2 gap-0.5">
        <p className="text-xs text-editor-muted mb-2">
          Transition applied when entering this scene.
        </p>

        <Row label="Type">
          <div className="flex flex-wrap gap-1">
            {TRANSITIONS.map(t => (
              <button
                key={t.value}
                onClick={() => setTransition(scene.id, { ...tr, type: t.value })}
                className={cn(
                  'text-xs px-2.5 py-1 rounded border transition-colors',
                  tr.type === t.value
                    ? 'bg-editor-accent-dim border-editor-accent text-editor-accent'
                    : 'bg-editor-elevated border-editor-border text-editor-muted hover:text-editor-text'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Row>

        {tr.type !== 'none' && (
          <Row label="Duration">
            <Slider value={tr.duration} min={0.1} max={2} step={0.1}
              onChange={v => setTransition(scene.id, { ...tr, duration: v })}
              display={`${tr.duration.toFixed(1)}s`} />
          </Row>
        )}

        {tr.type === 'slide' && (
          <Row label="Direction">
            <select
              value={tr.direction ?? 'left'}
              onChange={e => setTransition(scene.id, { ...tr, direction: e.target.value as SlideDir })}
              className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
            >
              <option value="left">From Left</option>
              <option value="right">From Right</option>
              <option value="up">From Top</option>
              <option value="down">From Bottom</option>
            </select>
          </Row>
        )}
      </div>
    </div>
  )
}
