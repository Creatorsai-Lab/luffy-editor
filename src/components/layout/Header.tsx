import { useState, useEffect, useRef } from 'react'
import { Minus, Square, X, FolderOpen, Plus, Trash2, Check } from 'lucide-react'
import luffyLogo from '/images/luffy_create_logo.webp'
import { useEditorStore } from '../../store/editorStore'
import { makeProject } from '../../utils/defaults'
import type { ProjectRecord } from '../../types/global'
import { cn } from '../../utils/cn'

export default function Header() {
  const { project, isDirty, loadProject, closeProject } = useEditorStore()
  const [panelOpen, setPanelOpen] = useState(false)
  const [projects,  setProjects]  = useState<ProjectRecord[]>([])
  const [creating,  setCreating]  = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const minimize = () => window.api.win.minimize()
  const maximize = () => window.api.win.maximize()
  const close    = () => window.api.win.close()

  useEffect(() => {
    if (panelOpen) window.api.projects.list().then(setProjects)
  }, [panelOpen])

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  async function createProject() {
    if (creating) return
    setCreating(true)
    try {
      const record = await window.api.projects.create(`Project ${projects.length + 1}`)
      const proj   = makeProject(record.id, record.name)
      proj.width   = 1080
      proj.height  = 1920
      await window.api.projects.save(record.id, JSON.stringify(proj))
      loadProject(proj)
      setPanelOpen(false)
    } finally {
      setCreating(false)
    }
  }

  async function openProject(id: string) {
    try {
      const data = await window.api.projects.load(id)
      loadProject(data as ReturnType<typeof makeProject>)
      setPanelOpen(false)
    } catch (e) { console.error('Failed to load project', e) }
  }

  async function deleteProject(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    await window.api.projects.delete(id)
    if (project?.id === id) closeProject()
    setProjects(await window.api.projects.list())
  }

  return (
    <header className="drag flex items-center justify-between h-8 bg-black px-3 flex-none relative z-50">
      {/* Left: logo + project switcher */}
      <div className="nodrag flex items-center gap-2" ref={panelRef}>
        <img src={luffyLogo} alt="Luffy" className="w-7 h-7 rounded-sm flex-none object-cover" />
        <span className="text-xs font-semibold text-white tracking-wide">Luffy Create</span>

        {/* Project button */}
        <button
          onClick={() => setPanelOpen(v => !v)}
          className={cn(
            'flex items-center gap-1.5 text-[13px] px-3 py-0.5 border-b max-w-[180px]',
            panelOpen
              ? 'bg-editor-accent-dim text-editor-accent'
              : 'text-editor-secondary hover:text-editor-text rounded hover:bg-editor-hover border-gray-500'
          )}
        >
          <FolderOpen size={12} className="flex-none" />
          <span className="truncate">{project?.name ?? 'No project'}</span>
          {isDirty && <span className="text-editor-accent">•</span>}
        </button>

        {/* Projects dropdown panel */}
        {panelOpen && (
          <div className="absolute top-full left-0 mt-px w-64 bg-editor-elevated border border-editor-border rounded-b-lg shadow-2xl">
            {/* New project */}
            <button
              onClick={createProject}
              disabled={creating}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-white hover:bg-editor-hover transition-colors border-b border-editor-border"
            >
              <Plus size={12} />
              {creating ? 'Creating…' : 'New Project'}
            </button>

            {/* Project list */}
            <div className="max-h-64 overflow-y-auto">
              {projects.length === 0 && (
                <p className="text-xs text-red px-3 py-3 text-center">No saved projects.</p>
              )}
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => openProject(p.id)}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                    project?.id === p.id
                      ? 'bg-editor-accent-dim text-editor-accent'
                      : 'text-editor-secondary hover:bg-editor-hover hover:text-editor-text'
                  )}
                >
                  {project?.id === p.id && <Check size={10} className="flex-none" />}
                  {project?.id !== p.id && <div className="w-[10px]" />}
                  <span className="flex-1 text-xs truncate">{p.name}</span>
                  <button
                    onClick={e => deleteProject(e, p.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#f2f2f2] hover:text-red-400 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: window controls */}
      <div className="nodrag flex items-center">
        <button onClick={minimize} className="flex items-center justify-center w-8 h-8 text-[#2cff00] hover:text-editor-text hover:bg-editor-hover transition-colors">
          <Minus size={12} />
        </button>
        <button onClick={maximize} className="flex items-center justify-center w-8 h-8 text-[#ffbb52] hover:text-editor-text hover:bg-editor-hover transition-colors">
          <Square size={11} />
        </button>
        <button onClick={close} className="flex items-center justify-center w-8 h-8 text-[#ff483b] hover:text-white hover:bg-red-600 transition-colors">
          <X size={12} />
        </button>
      </div>
    </header>
  )
}
