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

  if (!project) return (
    <aside className="w-56 flex-none bg-editor-panel border-r border-editor-border" />
  )

  const selected = getSelectedEls()
  const firstEl  = selected[0]

  // Determine which panel to show
  function renderPanel() {
    // If an element is selected and no explicit panel overrides it, show element props
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
      default:            return <EmptyPanel />
    }
  }

  return (
    <aside className="w-56 flex-none bg-editor-panel border-r border-editor-border flex flex-col overflow-hidden">
      {renderPanel()}
    </aside>
  )
}

function EmptyPanel() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <p className="text-xs text-editor-muted text-center leading-relaxed">
        Select a tool from the menu bar to see options here.
      </p>
    </div>
  )
}
