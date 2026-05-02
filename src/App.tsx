import { useEffect, useRef, useCallback, useState } from 'react'
import { useEditorStore } from './store/editorStore'
import { makeProject } from './utils/defaults'
import Header from './components/layout/Header'
import TopBar from './components/layout/TopBar'
import MenuBar from './components/layout/MenuBar'
import LeftSidebar from './components/layout/LeftSidebar'
import EditorCanvas from './components/canvas/EditorCanvas'
import Timeline from './components/layout/Timeline'
import CodeEditorModal from './components/modals/CodeEditorModal'
import PreviewModal from './components/modals/PreviewModal'
import ExportModal from './components/modals/ExportModal'

const AUTO_SAVE_DELAY = 2500

export default function App() {
  const {
    project, isDirty, markClean, loadProject,
    codeModalOpen, previewOpen, exportOpen
  } = useEditorStore()

  const [ready, setReady] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-load most recent project, or create a fresh vertical-HD project
  useEffect(() => {
    async function boot() {
      try {
        const list = await window.api.projects.list()
        if (list.length > 0) {
          // Most recent is first (index is prepended on create)
          const data = await window.api.projects.load(list[0].id)
          loadProject(data as ReturnType<typeof makeProject>)
        } else {
          const record = await window.api.projects.create('My Project')
          const proj   = makeProject(record.id, record.name)
          proj.width   = 1080
          proj.height  = 1920
          await window.api.projects.save(record.id, JSON.stringify(proj))
          loadProject(proj)
        }
      } catch (err) {
        // IPC unavailable (e.g., running outside Electron) — create in-memory project
        console.warn('Project IPC unavailable, using in-memory project', err)
        const proj  = makeProject('default', 'My Project')
        proj.width  = 1080
        proj.height = 1920
        loadProject(proj)
      }
      setReady(true)
    }
    boot()
  }, [])

  // Auto-save
  const doSave = useCallback(async () => {
    if (!project || project.id === 'default') return
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

  if (!ready) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-editor-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-editor-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-editor-muted">Loading project…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-editor-bg overflow-hidden">
      <Header />
      <TopBar />
      <MenuBar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftSidebar />
        <EditorCanvas />
      </div>

      <Timeline />

      {codeModalOpen && <CodeEditorModal />}
      {previewOpen   && <PreviewModal />}
      {exportOpen    && <ExportModal />}
    </div>
  )
}
