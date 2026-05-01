import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { Background, BgType, AnimatedBg } from '../../types/editor'
import { PanelHeader, Row, ColorInput, Slider, NumberInput } from './TextPanel'
import { cn } from '../../utils/cn'

const BG_TYPES: { label: string; value: BgType }[] = [
  { label: 'Solid',    value: 'solid' },
  { label: 'Gradient', value: 'gradient' },
  { label: 'Grid',     value: 'grid' },
  { label: 'Dots',     value: 'dots' },
  { label: 'Animated', value: 'animated' }
]

export default function BackgroundPanel() {
  const { project, currentSceneId, setBackground } = useEditorStore()
  const scene = project?.scenes.find(s => s.id === currentSceneId)

  if (!scene) return (
    <div className="flex-1 flex items-center justify-center p-4">
      <p className="text-xs text-editor-muted">No scene selected.</p>
    </div>
  )

  const bg = scene.background

  function setBg(patch: Partial<Background>) {
    setBackground(scene!.id, { ...bg, ...patch } as Background)
  }

  function changeBgType(type: BgType) {
    const defaults: Record<BgType, Background> = {
      solid:    { type: 'solid', color: '#1a1a2e' },
      gradient: { type: 'gradient', from: '#6366f1', to: '#0f0f1a', angle: 135 },
      grid:     { type: 'grid', bgColor: '#0f0f1a', lineColor: '#2a2a2a', cellSize: 40 },
      dots:     { type: 'dots', bgColor: '#0f0f1a', dotColor: '#2a2a2a', spacing: 24, radius: 1.5 },
      animated: { type: 'animated', variant: 'gradient-flow', colors: ['#6366f1', '#0f0f1a'], speed: 3 }
    }
    setBackground(scene!.id, defaults[type])
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <PanelHeader icon={<Settings2 size={12} />} title="Background" />

      <div className="px-3 py-2 border-b border-editor-border">
        <span className="label block mb-1.5">Type</span>
        <div className="flex flex-wrap gap-1">
          {BG_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => changeBgType(t.value)}
              className={cn(
                'text-xs px-2 py-1 rounded border transition-colors',
                bg.type === t.value
                  ? 'bg-editor-accent-dim border-editor-accent text-editor-accent'
                  : 'bg-editor-elevated border-editor-border text-editor-muted hover:text-editor-text'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col px-3 py-2 gap-0.5">
        {bg.type === 'solid' && (
          <Row label="Color"><ColorInput value={bg.color} onChange={c => setBg({ color: c })} /></Row>
        )}

        {bg.type === 'gradient' && (
          <>
            <Row label="From"><ColorInput value={bg.from} onChange={c => setBg({ from: c })} /></Row>
            <Row label="To"><ColorInput value={bg.to} onChange={c => setBg({ to: c })} /></Row>
            <Row label="Angle">
              <Slider value={bg.angle} min={0} max={360} step={1}
                onChange={v => setBg({ angle: v })} display={`${bg.angle}°`} />
            </Row>
          </>
        )}

        {bg.type === 'grid' && (
          <>
            <Row label="Background"><ColorInput value={bg.bgColor} onChange={c => setBg({ bgColor: c })} /></Row>
            <Row label="Line Color"><ColorInput value={bg.lineColor} onChange={c => setBg({ lineColor: c })} /></Row>
            <Row label="Cell Size">
              <Slider value={bg.cellSize} min={10} max={200} step={5}
                onChange={v => setBg({ cellSize: v })} display={`${bg.cellSize}px`} />
            </Row>
          </>
        )}

        {bg.type === 'dots' && (
          <>
            <Row label="Background"><ColorInput value={bg.bgColor} onChange={c => setBg({ bgColor: c })} /></Row>
            <Row label="Dot Color"><ColorInput value={bg.dotColor} onChange={c => setBg({ dotColor: c })} /></Row>
            <Row label="Spacing">
              <Slider value={bg.spacing} min={8} max={80} step={2}
                onChange={v => setBg({ spacing: v })} display={`${bg.spacing}px`} />
            </Row>
            <Row label="Radius">
              <Slider value={bg.radius} min={0.5} max={8} step={0.5}
                onChange={v => setBg({ radius: v })} display={`${bg.radius}px`} />
            </Row>
          </>
        )}

        {bg.type === 'animated' && (
          <>
            <Row label="Variant">
              <select
                value={bg.variant}
                onChange={e => setBg({ variant: e.target.value as AnimatedBg['variant'] })}
                className="w-full bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1"
              >
                <option value="gradient-flow">Gradient Flow</option>
                <option value="wave">Wave</option>
                <option value="particles">Particles</option>
              </select>
            </Row>
            <Row label="Color 1">
              <ColorInput value={bg.colors[0] ?? '#6366f1'} onChange={c => {
                const colors = [...bg.colors]; colors[0] = c; setBg({ colors })
              }} />
            </Row>
            <Row label="Color 2">
              <ColorInput value={bg.colors[1] ?? '#0f0f1a'} onChange={c => {
                const colors = [...bg.colors]; colors[1] = c; setBg({ colors })
              }} />
            </Row>
            <Row label="Speed">
              <Slider value={bg.speed} min={0.5} max={10} step={0.5}
                onChange={v => setBg({ speed: v })} display={`${bg.speed}x`} />
            </Row>
          </>
        )}
      </div>
    </div>
  )
}
