import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from './store/editorStore'
import { makeProject } from './utils/defaults'
import Header from './components/layout/Header'
import TopBar from './components/layout/TopBar'
import MenuBar from './components/layout/MenuBar'
import ProjectsPanel from './components/layout/ProjectsPanel'
import LeftSidebar from './components/layout/LeftSidebar'
import EditorCanvas from './components/canvas/EditorCanvas'
import RightSidebar from './components/layout/RightSidebar'
import Timeline from './components/layout/Timeline'
import CodeEditorModal from './components/modals/CodeEditorModal'
import PreviewModal from './components/modals/PreviewModal'
import ExportModal from './components/modals/ExportModal'

const AUTO_SAVE_DELAY = 2500

export default function App() {
  const {
    project, isDirty, markClean,
    codeModalOpen, previewOpen, exportOpen
  } = useEditorStore()

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save
  const doSave = useCallback(async () => {
    if (!project) return
    try {
      await window.api.projects.save(project.id, JSON.stringify(project))
      markClean()
    } catch (e) {
      console.error('Auto-save failed', e)
    }
  }, [project, markClean])

  useEffect(() => {
    if (!isDirty || !project) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, AUTO_SAVE_DELAY)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [isDirty, project, doSave])

  return (
    <div className="h-screen w-screen flex flex-col bg-editor-bg overflow-hidden">
      <Header />
      <TopBar />
      <MenuBar />

      {/* Main work area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ProjectsPanel />
        <LeftSidebar />
        <EditorCanvas />
        <RightSidebar />
      </div>

      <Timeline />

      {/* Modals */}
      {codeModalOpen && <CodeEditorModal />}
      {previewOpen   && <PreviewModal />}
      {exportOpen    && <ExportModal />}
    </div>
  )
}
