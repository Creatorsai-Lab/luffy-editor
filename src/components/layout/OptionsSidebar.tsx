import { useEditorStore } from '../../store/editorStore'
import TextPanel from '../panels/TextPanel'
import ShapePanel from '../panels/ShapePanel'
import ArrowPanel from '../panels/ArrowPanel'
import CodePanel from '../panels/CodePanel'
import TablePanel from '../panels/TablePanel'
import ChartPanel from '../panels/ChartPanel'
import TextAnimationPanel from '../panels/TextAnimationPanel'
import ShapeAnimationPanel from '../panels/ShapeAnimationPanel'
import ArrowAnimationPanel from '../panels/ArrowAnimationPanel'
import TextEffectsPanel from '../panels/TextEffectsPanel'
import BackgroundPanel from '../panels/BackgroundPanel'
import LayersPanel from '../panels/LayersPanel'
import TransitionPanel from '../panels/TransitionPanel'
import UploadPanel from '../panels/UploadPanel'
import AudioPanel from '../panels/AudioPanel'
import AudioPropertiesPanel from '../panels/AudioPropertiesPanel'
import ImagePanel from '../panels/ImagePanel'

export default function OptionsSidebar() {
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
      if (firstEl.type === 'chart')  return <ChartPanel />
      if (firstEl.type === 'image')  return <ImagePanel />
      if (firstEl.type === 'audio')  return <AudioPropertiesPanel element={firstEl} />
    }

    switch (activePanel) {
      case 'text':            return <TextPanel />
      case 'shapes':          return <ShapePanel />
      case 'arrows':          return <ArrowPanel />
      case 'code':            return <CodePanel />
      case 'table':           return <TablePanel />
      case 'charts':          return <ChartPanel />
      case 'upload':          return <UploadPanel />
      case 'audio':           return <AudioPanel />
      case 'textAnimations':  return <TextAnimationPanel />
      case 'shapeAnimations': return <ShapeAnimationPanel />
      case 'arrowAnimations': return <ArrowAnimationPanel />
      case 'textEffects':     return <TextEffectsPanel />
      case 'background':      return <BackgroundPanel />
      case 'layers':          return <LayersPanel />
      case 'transitions':     return <TransitionPanel />
      default:
        return <HintPanel text="Menu Options Panel (select to see)" />
    }
  }

  return (
    <aside className="w-55 flex-none bg-[#171717] flex flex-col overflow-hidden h-full">
      {renderPanel()}
    </aside>
  )
}

function HintPanel({ text }: { text: string }) {
  return (
    <div className="flex-1 flex mx-5 my-2 items-center text-center text-[#d8d8d8] justify-center">{text}
    </div>
  )
}
