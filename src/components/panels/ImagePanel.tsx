import { useState } from 'react'
import { Image as ImageIcon, Lock, Unlock, RotateCcw } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ImageElement } from '../../types/editor'
import { PanelHeader, Row, Slider, NumberInput } from './TextPanel'
import { cn } from '../../utils/cn'

export default function ImagePanel() {
  const { getSelectedEls, updateElement } = useEditorStore()
  const selected = getSelectedEls()
  const el = selected.find(e => e.type === 'image') as ImageElement | undefined

  const [lockRatio, setLockRatio] = useState(true)

  function upd(patch: Partial<ImageElement>) {
    if (el) updateElement(el.id, patch)
  }

  const ratio = el ? el.width / el.height : 1

  function handleWidth(newW: number) {
    if (!el) return
    if (lockRatio) {
      upd({ width: newW, height: Math.round(newW / ratio) })
    } else {
      upd({ width: newW })
    }
  }

  function handleHeight(newH: number) {
    if (!el) return
    if (lockRatio) {
      upd({ height: newH, width: Math.round(newH * ratio) })
    } else {
      upd({ height: newH })
    }
  }

  function resetFilters() {
    upd({ brightness: 100, contrast: 100, saturation: 100, hueRotate: 0, blur: 0, glass: false })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader icon={<ImageIcon size={12} />} title="Image" />

      <div className="flex-1 overflow-y-auto">
        {!el && (
          <p className="text-xs text-[#c1c1c1] px-3 py-3">
            Select an image element to edit its properties.
          </p>
        )}

        {el && (
          <div className="flex flex-col gap-0.5 px-3 py-2">

            {/* ── Dimensions ──────────────────────────────────────── */}
            <div className="pb-2 mb-1 border-b border-editor-border">
              <span className="text-xs font-medium text-editor-text block mb-1">Dimensions</span>

              <Row label="Width">
                <NumberInput value={Math.round(el.width)} min={10} max={9999} onChange={handleWidth} />
              </Row>

              <Row label="Height">
                <NumberInput value={Math.round(el.height)} min={10} max={9999} onChange={handleHeight} />
              </Row>

              <Row label="Lock Ratio">
                <button
                  onClick={() => setLockRatio(v => !v)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
                    lockRatio
                      ? 'bg-editor-accent text-white'
                      : 'bg-editor-elevated text-[#c1c1c1] hover:text-editor-text border border-editor-border'
                  )}
                >
                  {lockRatio ? <Lock size={10} /> : <Unlock size={10} />}
                  {lockRatio ? 'Locked' : 'Unlocked'}
                </button>
              </Row>

              <Row label="Corner Radius">
                <Slider
                  value={el.cornerRadius}
                  min={0} max={200} step={1}
                  onChange={v => upd({ cornerRadius: v })}
                  display={`${el.cornerRadius}px`}
                />
              </Row>
            </div>

            {/* ── Adjustments ─────────────────────────────────────── */}
            <div className="pb-2 mb-1 border-b border-editor-border">
              <span className="text-xs font-medium text-editor-text block mb-1">Adjustments</span>

              <Row label="Opacity">
                <Slider
                  value={Math.round((el.opacity ?? 1) * 100)}
                  min={0} max={100} step={1}
                  onChange={v => upd({ opacity: v / 100 })}
                  display={`${Math.round((el.opacity ?? 1) * 100)}%`}
                />
              </Row>

              <Row label="Brightness">
                <Slider
                  value={el.brightness ?? 100}
                  min={0} max={200} step={1}
                  onChange={v => upd({ brightness: v })}
                  display={`${el.brightness ?? 100}%`}
                />
              </Row>

              <Row label="Contrast">
                <Slider
                  value={el.contrast ?? 100}
                  min={0} max={200} step={1}
                  onChange={v => upd({ contrast: v })}
                  display={`${el.contrast ?? 100}%`}
                />
              </Row>

              <Row label="Saturation">
                <Slider
                  value={el.saturation ?? 100}
                  min={0} max={200} step={1}
                  onChange={v => upd({ saturation: v })}
                  display={`${el.saturation ?? 100}%`}
                />
              </Row>

              <Row label="Hue Rotate">
                <Slider
                  value={el.hueRotate ?? 0}
                  min={0} max={360} step={1}
                  onChange={v => upd({ hueRotate: v })}
                  display={`${el.hueRotate ?? 0}°`}
                />
              </Row>

              <Row label="Blur">
                <Slider
                  value={el.blur ?? 0}
                  min={0} max={20} step={0.5}
                  onChange={v => upd({ blur: v })}
                  display={`${el.blur ?? 0}px`}
                />
              </Row>
            </div>

            {/* ── Effects ─────────────────────────────────────────── */}
            <div className="pb-2">
              <span className="text-xs font-medium text-editor-text block mb-1">Effects</span>

              <Row label="Glassmorphism">
                <button
                  onClick={() => upd({ glass: !el.glass })}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
                    el.glass
                      ? 'bg-editor-accent text-white'
                      : 'bg-editor-elevated text-[#c1c1c1] hover:text-editor-text border border-editor-border'
                  )}
                >
                  {el.glass ? 'On' : 'Off'}
                </button>
              </Row>

              <div className="mt-2">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-editor-elevated text-[#c1c1c1] hover:text-editor-text border border-editor-border transition-colors"
                >
                  <RotateCcw size={10} />
                  Reset Adjustments
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
