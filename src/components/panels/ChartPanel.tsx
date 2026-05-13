import { BarChart3, LineChart, PieChart, Plus, Trash2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ChartElement } from '../../types/editor'
import { PanelHeader, Row, ColorInput, Slider } from './TextPanel'
import { cn } from '../../utils/cn'

const CHART_TYPES: { icon: React.ReactNode; type: ChartElement['chartType']; label: string }[] = [
  { icon: <BarChart3 size={14} />, type: 'bar',      label: 'Bar' },
  { icon: <LineChart size={14} />, type: 'line',     label: 'Line' },
  { icon: <PieChart size={14} />,  type: 'pie',      label: 'Pie' },
  { icon: <PieChart size={14} />,  type: 'doughnut', label: 'Doughnut' },
  { icon: <LineChart size={14} />, type: 'area',     label: 'Area' }
]

export default function ChartPanel() {
  const { getSelectedEls, updateElement, setActiveTool } = useEditorStore()
  const el = getSelectedEls().find(e => e.type === 'chart') as ChartElement | undefined

  function upd(patch: Partial<ChartElement>) {
    if (el) updateElement(el.id, patch)
  }

  function addDataset() {
    if (!el) return
    const newDataset = {
      label: `Dataset ${el.data.datasets.length + 1}`,
      data: el.data.labels.map(() => Math.floor(Math.random() * 20)),
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }
    upd({
      data: {
        ...el.data,
        datasets: [...el.data.datasets, newDataset]
      }
    })
  }

  function removeDataset(index: number) {
    if (!el || el.data.datasets.length <= 1) return
    upd({
      data: {
        ...el.data,
        datasets: el.data.datasets.filter((_, i) => i !== index)
      }
    })
  }

  function updateDatasetLabel(index: number, label: string) {
    if (!el) return
    const datasets = [...el.data.datasets]
    datasets[index] = { ...datasets[index], label }
    upd({ data: { ...el.data, datasets } })
  }

  function updateDatasetColor(index: number, color: string) {
    if (!el) return
    const datasets = [...el.data.datasets]
    datasets[index] = { ...datasets[index], color }
    upd({ data: { ...el.data, datasets } })
  }

  function updateDataValue(datasetIndex: number, valueIndex: number, value: number) {
    if (!el) return
    const datasets = [...el.data.datasets]
    const data = [...datasets[datasetIndex].data]
    data[valueIndex] = value
    datasets[datasetIndex] = { ...datasets[datasetIndex], data }
    upd({ data: { ...el.data, datasets } })
  }

  function addLabel() {
    if (!el) return
    const newLabel = `Label ${el.data.labels.length + 1}`
    upd({
      data: {
        labels: [...el.data.labels, newLabel],
        datasets: el.data.datasets.map(ds => ({
          ...ds,
          data: [...ds.data, 0]
        }))
      }
    })
  }

  function removeLabel(index: number) {
    if (!el || el.data.labels.length <= 1) return
    upd({
      data: {
        labels: el.data.labels.filter((_, i) => i !== index),
        datasets: el.data.datasets.map(ds => ({
          ...ds,
          data: ds.data.filter((_, i) => i !== index)
        }))
      }
    })
  }

  function updateLabel(index: number, label: string) {
    if (!el) return
    const labels = [...el.data.labels]
    labels[index] = label
    upd({ data: { ...el.data, labels } })
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <PanelHeader icon={<BarChart3 size={12} />} title="Chart" />

      {/* Chart type picker */}
      <div className="px-3 py-2 border-b border-editor-border">
        <span className="label block mb-1.5">Add Chart</span>
        <button
          onClick={() => setActiveTool('chart')}
          className="w-full px-3 py-2 rounded bg-editor-accent text-white text-xs hover:bg-editor-accent/90 transition-colors"
        >
          <Plus size={14} className="inline mr-1" />
          Add Chart to Canvas
        </button>
      </div>

      {el && (
        <div className="flex flex-col px-3 py-2 gap-2">
          {/* Chart Type */}
          <div>
            <span className="label block mb-1.5">Chart Type</span>
            <div className="grid grid-cols-3 gap-1">
              {CHART_TYPES.map(ct => (
                <button
                  key={ct.type}
                  onClick={() => upd({ chartType: ct.type })}
                  title={ct.label}
                  className={cn(
                    'flex flex-col items-center justify-center p-2 rounded border transition-colors',
                    el.chartType === ct.type
                      ? 'bg-editor-accent-dim border-editor-accent text-editor-accent'
                      : 'bg-editor-elevated border-editor-border text-[#c1c1c1] hover:text-editor-text'
                  )}
                >
                  {ct.icon}
                  <span className="text-[10px] mt-1">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <Row label="Show Legend">
            <input
              type="checkbox"
              checked={el.showLegend}
              onChange={e => upd({ showLegend: e.target.checked })}
              className="w-4 h-4"
            />
          </Row>

          {el.chartType !== 'pie' && el.chartType !== 'doughnut' && (
            <Row label="Show Grid">
              <input
                type="checkbox"
                checked={el.showGrid}
                onChange={e => upd({ showGrid: e.target.checked })}
                className="w-4 h-4"
              />
            </Row>
          )}

          <Row label="Background">
            <ColorInput value={el.backgroundColor} onChange={v => upd({ backgroundColor: v })} />
          </Row>

          {/* Labels */}
          <div className="border-t border-editor-border pt-2 mt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="label">Labels</span>
              <button
                onClick={addLabel}
                className="text-xs text-editor-accent hover:text-editor-accent/80"
              >
                <Plus size={12} className="inline" /> Add
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {el.data.labels.map((label, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={label}
                    onChange={e => updateLabel(i, e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-editor-elevated border border-editor-border rounded"
                  />
                  <button
                    onClick={() => removeLabel(i)}
                    disabled={el.data.labels.length <= 1}
                    className="p-1 text-[#c1c1c1] hover:text-red-400 disabled:opacity-30"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Datasets */}
          <div className="border-t border-editor-border pt-2 mt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="label">Datasets</span>
              <button
                onClick={addDataset}
                className="text-xs text-editor-accent hover:text-editor-accent/80"
              >
                <Plus size={12} className="inline" /> Add
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {el.data.datasets.map((dataset, dsIndex) => (
                <div key={dsIndex} className="p-2 bg-editor-elevated rounded border border-editor-border">
                  <div className="flex items-center gap-1 mb-2">
                    <input
                      type="text"
                      value={dataset.label}
                      onChange={e => updateDatasetLabel(dsIndex, e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-editor-base border border-editor-border rounded"
                      placeholder="Dataset name"
                    />
                    <ColorInput
                      value={dataset.color}
                      onChange={v => updateDatasetColor(dsIndex, v)}
                    />
                    <button
                      onClick={() => removeDataset(dsIndex)}
                      disabled={el.data.datasets.length <= 1}
                      className="p-1 text-[#c1c1c1] hover:text-red-400 disabled:opacity-30"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {dataset.data.map((value, valIndex) => (
                      <div key={valIndex} className="flex items-center gap-1">
                        <span className="text-[10px] text-[#c1c1c1] w-16 truncate">
                          {el.data.labels[valIndex]}:
                        </span>
                        <input
                          type="number"
                          value={value}
                          onChange={e => updateDataValue(dsIndex, valIndex, parseFloat(e.target.value) || 0)}
                          className="flex-1 px-2 py-1 text-xs bg-editor-base border border-editor-border rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Row label="Opacity">
            <Slider value={el.opacity} min={0} max={1} step={0.01}
              onChange={v => upd({ opacity: v })} display={`${Math.round(el.opacity * 100)}%`} />
          </Row>
        </div>
      )}

      {!el && (
        <p className="text-xs text-[#c1c1c1] px-3 py-3">
          Click "Add Chart to Canvas" above, then click the canvas to place it.
        </p>
      )}
    </div>
  )
}
