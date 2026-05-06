import {
  Type, Square, ArrowRight, Code2, Table2, Image,
  Sparkles, Layers, Shuffle, Upload, Wand2
} from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ActiveTool, ActivePanel } from '../../types/editor'
import { cn } from '../../utils/cn'
import Tooltip from '../ui/Tooltip'

interface ToolItem {
  icon: React.ReactNode
  label: string
  tool?: ActiveTool
  panel: ActivePanel
  separator?: boolean
  tooltip?: string
}

const TOOLS: ToolItem[] = [
  { icon: <Type size={14} />,       label: 'Text',             tool: 'text',           panel: 'text',             tooltip: 'Add text (T)' },
  { icon: <Square size={14} />,     label: 'Shapes',           tool: 'shape-rect',     panel: 'shapes',           tooltip: 'Add shapes (S)' },
  { icon: <ArrowRight size={14} />, label: 'Arrow',            tool: 'arrow',          panel: 'arrows',           tooltip: 'Add arrow (A)' },
  { icon: <Code2 size={14} />,      label: 'Code',             tool: 'code',           panel: 'code',             tooltip: 'Add code block (C)' },
  { icon: <Table2 size={14} />,     label: 'Table',            tool: 'table',          panel: 'table',            tooltip: 'Add table' },
  { icon: <Upload size={14} />,     label: 'Upload',           tool: 'image',          panel: 'upload',           separator: true, tooltip: 'Upload image/video' },
  { icon: <Type size={14} />,       label: 'Text Animations',                          panel: 'textAnimations',   separator: true, tooltip: 'Text animations' },
  { icon: <Sparkles size={14} />,   label: 'Shape Animations',                         panel: 'shapeAnimations',  tooltip: 'Shape animations' },
  { icon: <Wand2 size={14} />,      label: 'Text Effects',                             panel: 'textEffects',      tooltip: 'Text effects' },
  { icon: <Shuffle size={14} />,    label: 'Transitions',                              panel: 'transitions',      separator: true, tooltip: 'Scene transitions' },
  { icon: <Layers size={14} />,     label: 'Layers',                                   panel: 'layers',           tooltip: 'Layers panel' },
]

export default function MenuBar() {
  const { project, activeTool, activePanel, setActiveTool, setActivePanel } = useEditorStore()
  const disabled = !project

  return (
    <div className="h-8 bg-[#171717] flex items-center px-2 gap-0.5 flex-none nodrag overflow-x-auto no-scrollbar">
      {TOOLS.map((item, i) => (
        <div key={i} className="flex items-center">
          {item.separator && <div className="w-px h-4 bg-editor-border mx-1" />}
          <Tooltip text={item.tooltip || item.label}>
            <button
              disabled={disabled}
              onClick={() => {
                if (disabled) return
                if (item.tool) setActiveTool(item.tool)
                setActivePanel(activePanel === item.panel ? null : item.panel)
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors whitespace-nowrap',
                disabled
                  ? 'text-editor-border cursor-default'
                  : activePanel === item.panel
                    ? 'bg-editor-accent-dim text-editor-accent'
                    : 'text-editor-secondary hover:text-editor-text hover:bg-editor-hover'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}
