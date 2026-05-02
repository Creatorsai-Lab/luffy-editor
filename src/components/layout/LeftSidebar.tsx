import { useEditorStore } from '../../store/editorStore'
import TextPanel from '../panels/TextPanel'
import ShapePanel from '../panels/ShapePanel'
import ArrowPanel from '../panels/ArrowPanel'
import CodePanel from '../panels/CodePanel'
import TablePanel from '../panels/TablePanel'
import AnimationPanel from '../panels/AnimationPanel'
import BackgroundPanel from '../panels/BackgroundPanel'
import LayersPanel from '../panels/LayersPanel'
import TransitionPanel from '../panels/TransitionPanel'
import UploadPanel from '../panels/UploadPanel'

export default function LeftSidebar() {
  const { project, activePanel, getSelectedEls } = useEditorStore()

  const selected = project ? getSelectedEls() : []
  const firstEl  = selected[0]

  function renderPanel() {
    if (!project) {
      return <HintPanel text="Open or create a project to start editing." />
    }

    // Auto-show element panel when element is selected and no explicit panel is active
    if (firstEl && !activePanel) {
      if (firstEl.type === 'text')   return <TextPanel />
      if (firstEl.type === 'shape')  return <ShapePanel />
      if (firstEl.type === 'arrow')  return <ArrowPanel />
      if (firstEl.type === 'code')   return <CodePanel />
      if (firstEl.type === 'table')  return <TablePanel />
    }

    switch (activePanel) {
      case 'text':        return <TextPanel />
      case 'shapes':      return <ShapePanel />
      case 'arrows':      return <ArrowPanel />
      case 'code':        return <CodePanel />
      case 'table':       return <TablePanel />
      case 'upload':      return <UploadPanel />
      case 'animations':  return <AnimationPanel />
      case 'background':  return <BackgroundPanel />
      case 'layers':      return <LayersPanel />
      case 'transitions': return <TransitionPanel />
      default:
        return <HintPanel text="Select a tool from the menu bar to see options here." />
    }
  }

  return (
    <aside className="w-56 flex-none bg-editor-panel border-r border-editor-border flex flex-col overflow-hidden">
      {renderPanel()}
    </aside>
  )
}

function HintPanel({ text }: { text: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <p className="text-xs text-editor-muted text-center leading-relaxed">{text}</p>
    </div>
  )
}
