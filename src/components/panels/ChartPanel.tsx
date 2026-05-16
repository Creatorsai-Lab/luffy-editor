import { useState } from 'react'
import { BarChart3, LineChart, PieChart, Plus, Trash2, Sparkles, TrendingUp } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ChartElement, AnimationType, EasingType, SlideDir } from '../../types/editor'
import { makeAnimation } from '../../utils/defaults'
import { PanelHeader, Row, ColorInput, Slider, NumberInput } from './TextPanel'
import { cn } from '../../utils/cn'

const CHART_TYPES: { icon: React.ReactNode; type: ChartElement['chartType']; label: string }[] = [
  { icon: <BarChart3 size={13} />,   type: 'bar',      label: 'Bar' },
  { icon: <LineChart size={13} />,   type: 'line',     label: 'Line' },
  { icon: <TrendingUp size={13} />,  type: 'area',     label: 'Area' },
  { icon: <PieChart size={13} />,    type: 'pie',      label: 'Pie' },
  { icon: <PieChart size={13} />,    type: 'doughnut', label: 'Ring' },
]

const ENTER_ANIMS: { label: string; value: AnimationType }[] = [
  { label: 'None',       value: 'fadeIn' },
  { label: 'Fade In',    value: 'fadeIn' },
  { label: 'Slide In',   value: 'slideIn' },
  { label: 'Scale In',   value: 'scaleIn' },
  { label: 'Zoom In',    value: 'textZoomIn' },
]

const SLIDE_DIRS: { label: string; value: SlideDir }[] = [
  { label: '← Left', value: 'left' },
  { label: '→ Right', value: 'right' },
  { label: '↑ Up',   value: 'up' },
  { label: '↓ Down', value: 'down' },
]

export default function ChartPanel() {
  const { getSelectedEls, updateElement, addAnimation, updateAnimation, removeAnimation, setActiveTool } = useEditorStore()
  const el = getSelectedEls().find(e => e.type === 'chart') as ChartElement | undefined

  function upd(patch: Partial<ChartElement>) {
    if (el) updateElement(el.id, patch)
  }

  function addDataset() {
    if (!el) return
    upd({
      data: {
        ...el.data,
        datasets: [...el.data.datasets, {
          label: `Series ${el.data.datasets.length + 1}`,
          data: el.data.labels.map(() => Math.floor(Math.random() * 20) + 1),
          color: ['#6366f1','#22c55e','#f59e0b','#ec4899','#06b6d4'][el.data.datasets.length % 5]
        }]
      }
    })
  }

  function removeDataset(idx: number) {
    if (!el || el.data.datasets.length <= 1) return
    upd({ data: { ...el.data, datasets: el.data.datasets.filter((_, i) => i !== idx) } })
  }

  function addLabel() {
    if (!el) return
    upd({
      data: {
        labels: [...el.data.labels, `L${el.data.labels.length + 1}`],
        datasets: el.data.datasets.map(ds => ({ ...ds, data: [...ds.data, 0] }))
      }
    })
  }

  function removeLabel(idx: number) {
    if (!el || el.data.labels.length <= 1) return
    upd({
      data: {
        labels: el.data.labels.filter((_, i) => i !== idx),
        datasets: el.data.datasets.map(ds => ({ ...ds, data: ds.data.filter((_, i) => i !== idx) }))
      }
    })
  }

  function updateLabel(idx: number, v: string) {
    if (!el) return
    const labels = [...el.data.labels]; labels[idx] = v
    upd({ data: { ...el.data, labels } })
  }

  function updateDatasetLabel(dsIdx: number, v: string) {
    if (!el) return
    const datasets = el.data.datasets.map((ds, i) => i === dsIdx ? { ...ds, label: v } : ds)
    upd({ data: { ...el.data, datasets } })
  }

  function updateDatasetColor(dsIdx: number, color: string) {
    if (!el) return
    const datasets = el.data.datasets.map((ds, i) => i === dsIdx ? { ...ds, color } : ds)
    upd({ data: { ...el.data, datasets } })
  }

  function updateValue(dsIdx: number, valIdx: number, v: number) {
    if (!el) return
    const datasets = el.data.datasets.map((ds, i) => {
      if (i !== dsIdx) return ds
      const data = [...ds.data]; data[valIdx] = v
      return { ...ds, data }
    })
    upd({ data: { ...el.data, datasets } })
  }

  const enterAnim = el?.animations.find(a => a.timing === 'onEnter')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader icon={<BarChart3 size={12} />} title="Chart" />

      <div className="flex-1 overflow-y-auto">
        {/* Add chart button */}
        <div className="px-3 py-2 border-b border-editor-border">
          <button
            onClick={() => setActiveTool('chart')}
            className="w-full px-3 py-2 rounded bg-editor-accent-dim text-editor-accent border border-editor-accent text-xs hover:bg-editor-accent hover:text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={11} /> Add Chart to Canvas
          </button>
        </div>

        {!el && (
          <p className="text-xs text-[#c1c1c1] px-3 py-3">
            Click above, then click the canvas to place a chart.
          </p>
        )}

        {el && (
          <>
            {/* Chart type */}
            <div className="px-3 py-2 border-b border-editor-border">
              <span className="label block mb-2">Type</span>
              <div className="grid grid-cols-5 gap-1">
                {CHART_TYPES.map(ct => (
                  <button
                    key={ct.type}
                    onClick={() => upd({ chartType: ct.type })}
                    title={ct.label}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 py-2 rounded border transition-colors',
                      el.chartType === ct.type
                        ? 'bg-editor-accent border-editor-accent text-white'
                        : 'bg-editor-elevated border-editor-border text-[#c1c1c1] hover:text-editor-text hover:border-editor-text/40'
                    )}
                  >
                    {ct.icon}
                    <span className="text-[9px]">{ct.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="px-3 py-2 border-b border-editor-border flex flex-col gap-1.5">
              <span className="label">Style</span>
              <Row label="Background">
                <ColorInput value={el.backgroundColor} onChange={v => upd({ backgroundColor: v })} />
              </Row>
              <Row label="Label Color">
                <ColorInput value={el.textColor ?? '#999999'} onChange={v => upd({ textColor: v })} />
              </Row>
              <Row label="Font Size">
                <Slider value={el.fontSize ?? 10} min={6} max={24} step={1}
                  onChange={v => upd({ fontSize: v })} display={`${el.fontSize ?? 10}px`} />
              </Row>
              <Row label="Corner Radius">
                <Slider value={el.cornerRadius ?? 4} min={0} max={32} step={1}
                  onChange={v => upd({ cornerRadius: v })} display={`${el.cornerRadius ?? 4}px`} />
              </Row>
              <Row label="Opacity">
                <Slider value={el.opacity} min={0} max={1} step={0.01}
                  onChange={v => upd({ opacity: v })} display={`${Math.round(el.opacity * 100)}%`} />
              </Row>

              <div className="flex items-center gap-3 pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={el.showLegend}
                    onChange={e => upd({ showLegend: e.target.checked })}
                    className="w-3.5 h-3.5 accent-editor-accent" />
                  <span className="text-xs text-[#c1c1c1]">Legend</span>
                </label>
                {el.chartType !== 'pie' && el.chartType !== 'doughnut' && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={el.showGrid}
                      onChange={e => upd({ showGrid: e.target.checked })}
                      className="w-3.5 h-3.5 accent-editor-accent" />
                    <span className="text-xs text-[#c1c1c1]">Grid</span>
                  </label>
                )}
              </div>
            </div>

            {/* Labels (categories) */}
            <div className="px-3 py-2 border-b border-editor-border">
              <div className="flex items-center justify-between mb-2">
                <span className="label">Categories</span>
                <button onClick={addLabel}
                  className="flex items-center gap-1 text-xs text-editor-accent hover:text-editor-accent/80">
                  <Plus size={10} /> Add
                </button>
              </div>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {el.data.labels.map((label, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      type="text" value={label}
                      onChange={e => updateLabel(i, e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-editor-elevated border border-editor-border rounded text-editor-text nodrag"
                    />
                    <button onClick={() => removeLabel(i)}
                      disabled={el.data.labels.length <= 1}
                      className="p-1 text-[#c1c1c1] hover:text-red-400 disabled:opacity-30">
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Datasets */}
            <div className="px-3 py-2 border-b border-editor-border">
              <div className="flex items-center justify-between mb-2">
                <span className="label">Data Series</span>
                <button onClick={addDataset}
                  className="flex items-center gap-1 text-xs text-editor-accent hover:text-editor-accent/80">
                  <Plus size={10} /> Add
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {el.data.datasets.map((ds, dsIdx) => (
                  <div key={dsIdx} className="bg-editor-elevated rounded border border-editor-border p-2">
                    {/* Header row */}
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: ds.color }} />
                      <input
                        type="text" value={ds.label}
                        onChange={e => updateDatasetLabel(dsIdx, e.target.value)}
                        className="flex-1 px-1.5 py-0.5 text-xs bg-editor-base border border-editor-border rounded text-editor-text nodrag"
                        placeholder="Series name"
                      />
                      <ColorInput value={ds.color} onChange={v => updateDatasetColor(dsIdx, v)} />
                      <button onClick={() => removeDataset(dsIdx)}
                        disabled={el.data.datasets.length <= 1}
                        className="p-0.5 text-[#c1c1c1] hover:text-red-400 disabled:opacity-30">
                        <Trash2 size={10} />
                      </button>
                    </div>
                    {/* Values */}
                    <div className="flex flex-col gap-1">
                      {ds.data.map((val, valIdx) => (
                        <div key={valIdx} className="flex items-center gap-1">
                          <span className="text-[10px] text-[#c1c1c1] w-14 truncate">
                            {el.data.labels[valIdx] ?? `#${valIdx + 1}`}:
                          </span>
                          <input
                            type="number" value={val}
                            onChange={e => updateValue(dsIdx, valIdx, parseFloat(e.target.value) || 0)}
                            className="flex-1 px-1.5 py-0.5 text-xs bg-editor-base border border-editor-border rounded text-editor-text nodrag"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Animation */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={11} className="text-editor-accent" />
                <span className="label">Enter Animation</span>
              </div>

              {!enterAnim ? (
                <button
                  onClick={() => addAnimation(el.id, { ...makeAnimation(), type: 'fadeIn', timing: 'onEnter', duration: 0.8 })}
                  className="w-full text-xs py-1.5 px-3 bg-editor-accent-dim text-editor-accent border border-editor-accent rounded hover:bg-editor-accent hover:text-white transition-colors flex items-center justify-center gap-1"
                >
                  <Plus size={10} /> Add Enter Animation
                </button>
              ) : (
                <div className="flex flex-col gap-1.5 p-2 bg-editor-elevated border border-editor-border rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-editor-secondary">Enter</span>
                    <button onClick={() => removeAnimation(el.id, enterAnim.id)}
                      className="text-[#c1c1c1] hover:text-red-400">
                      <Trash2 size={10} />
                    </button>
                  </div>

                  <Row label="Type">
                    <select
                      value={enterAnim.type}
                      onChange={e => updateAnimation(el.id, enterAnim.id, { type: e.target.value as AnimationType })}
                      className="w-full bg-editor-base border border-editor-border rounded text-xs text-editor-text px-2 py-1"
                    >
                      {[
                        { label: 'Fade In',  value: 'fadeIn' },
                        { label: 'Slide In', value: 'slideIn' },
                        { label: 'Scale In', value: 'scaleIn' },
                        { label: 'Zoom In',  value: 'textZoomIn' },
                        { label: 'Bounce',   value: 'textBounce' },
                      ].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Row>

                  {(enterAnim.type === 'slideIn') && (
                    <Row label="Direction">
                      <select
                        value={enterAnim.params?.direction ?? 'left'}
                        onChange={e => updateAnimation(el.id, enterAnim.id, { params: { direction: e.target.value as SlideDir } })}
                        className="w-full bg-editor-base border border-editor-border rounded text-xs text-editor-text px-2 py-1"
                      >
                        {SLIDE_DIRS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </Row>
                  )}

                  <Row label="Duration (s)">
                    <Slider value={enterAnim.duration} min={0.1} max={5} step={0.1}
                      onChange={v => updateAnimation(el.id, enterAnim.id, { duration: v })}
                      display={`${enterAnim.duration.toFixed(1)}s`} />
                  </Row>

                  <Row label="Delay (s)">
                    <Slider value={enterAnim.delay} min={0} max={10} step={0.1}
                      onChange={v => updateAnimation(el.id, enterAnim.id, { delay: v })}
                      display={`${enterAnim.delay.toFixed(1)}s`} />
                  </Row>

                  <Row label="Easing">
                    <select
                      value={enterAnim.easing}
                      onChange={e => updateAnimation(el.id, enterAnim.id, { easing: e.target.value as EasingType })}
                      className="w-full bg-editor-base border border-editor-border rounded text-xs text-editor-text px-2 py-1"
                    >
                      {['linear','easeIn','easeOut','easeInOut','bounce'].map(v =>
                        <option key={v} value={v}>{v}</option>)}
                    </select>
                  </Row>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
