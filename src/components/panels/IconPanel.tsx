import { useState, useMemo } from 'react'
import { Shapes, Search } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { IconElement } from '../../types/editor'
import { ICON_MAP, ICON_CATEGORIES, ALL_CATEGORY } from '../../engine/iconData'
import { makeIcon } from '../../utils/defaults'
import { PanelHeader, Row, ColorInput } from './TextPanel'

const CATEGORIES = [ALL_CATEGORY, ...Object.keys(ICON_CATEGORIES)]

export default function IconPanel() {
  const { addElement, updateElement, getSelectedEls } = useEditorStore()

  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState(ALL_CATEGORY)

  const selected = getSelectedEls()
  const iconEl   = selected.find(e => e.type === 'icon') as IconElement | undefined

  const filteredIcons = useMemo(() => {
    const pool = category === ALL_CATEGORY
      ? Object.keys(ICON_MAP)
      : (ICON_CATEGORIES[category] ?? [])
    const q = query.toLowerCase().replace(/\s/g, '')
    return q ? pool.filter(n => n.toLowerCase().includes(q)) : pool
  }, [category, query])

  function handleInsert(iconName: string) {
    addElement(makeIcon(iconName, 80, 80))
  }

  function upd(patch: Partial<IconElement>) {
    if (iconEl) updateElement(iconEl.id, patch)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader icon={<Shapes size={12} />} title="Icons" />

      {/* Search */}
      <div className="px-3 py-2 border-b border-editor-border">
        <div className="flex items-center gap-2 bg-editor-elevated border border-editor-border rounded px-2 py-1">
          <Search size={11} className="text-[#c1c1c1] flex-none" />
          <input
            type="text"
            placeholder="Search icons…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-editor-text outline-none placeholder-[#c1c1c1] nodrag"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto no-scrollbar border-b border-editor-border flex-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-none text-[10px] px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
              category === cat
                ? 'bg-editor-accent text-white'
                : 'bg-editor-elevated text-[#c1c1c1] hover:text-editor-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Icon grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {filteredIcons.map(name => {
            const Comp = ICON_MAP[name]
            if (!Comp) return null
            const isSelected = iconEl?.iconName === name
            return (
              <button
                key={name}
                title={name}
                onClick={() => handleInsert(name)}
                className={`aspect-square flex items-center justify-center rounded transition-all group ${
                  isSelected
                    ? 'bg-editor-accent/20 ring-1 ring-editor-accent'
                    : 'bg-editor-elevated hover:bg-editor-hover'
                }`}
              >
                <Comp
                  size={20}
                  strokeWidth={1.75}
                  className="text-[#d8d8d8] group-hover:text-editor-accent transition-colors"
                />
              </button>
            )
          })}
          {filteredIcons.length === 0 && (
            <p className="col-span-5 text-xs text-[#c1c1c1] text-center py-4">No icons found.</p>
          )}
        </div>
      </div>

      {/* Selected icon properties */}
      {iconEl && (
        <div className="border-t border-editor-border px-3 py-3 flex flex-col gap-2 flex-none">
          <div className="text-[10px] text-[#c1c1c1] uppercase tracking-wider font-medium">
            {iconEl.iconName}
          </div>

          <Row label="Color">
            <ColorInput
              value={iconEl.color}
              onChange={v => upd({ color: v })}
            />
          </Row>

          <Row label="Stroke Width">
            <input
              type="range" min={0.5} max={4} step={0.5}
              value={iconEl.strokeWidth}
              onChange={e => upd({ strokeWidth: parseFloat(e.target.value) })}
              className="flex-1 accent-editor-accent nodrag"
            />
            <span className="text-[10px] text-[#c1c1c1] w-5 text-right">{iconEl.strokeWidth}</span>
          </Row>

          <Row label="Opacity">
            <input
              type="range" min={0} max={1} step={0.01}
              value={iconEl.opacity}
              onChange={e => upd({ opacity: parseFloat(e.target.value) })}
              className="flex-1 accent-editor-accent nodrag"
            />
            <span className="text-[10px] text-[#c1c1c1] w-8 text-right">
              {Math.round(iconEl.opacity * 100)}%
            </span>
          </Row>
        </div>
      )}
    </div>
  )
}
