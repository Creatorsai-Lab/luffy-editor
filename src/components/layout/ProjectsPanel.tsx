import { useState, useEffect } from 'react'
import { Plus, Folder, Trash2, Edit2, Check, X } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { makeProject } from '../../utils/defaults'
import type { ProjectRecord } from '../../types/global'
import { cn } from '../../utils/cn'

export default function ProjectsPanel() {
  const { currentProjectId, loadProject, closeProject } = useEditorStore()
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')

  useEffect(() => {
    window.api.projects.list().then(setProjects)
  }, [])

  async function createProject() {
    const name = `Project ${projects.length + 1}`
    const record = await window.api.projects.create(name)
    const proj = makeProject(record.id, record.name)
    await window.api.projects.save(record.id, JSON.stringify(proj))
    loadProject(proj)
    setProjects(await window.api.projects.list())
  }

  async function openProject(id: string) {
    try {
      const data = await window.api.projects.load(id) as ReturnType<typeof makeProject>
      loadProject(data)
    } catch (e) {
      console.error('Failed to load project', e)
    }
  }

  async function deleteProject(id: string) {
    await window.api.projects.delete(id)
    if (currentProjectId === id) closeProject()
    setProjects(await window.api.projects.list())
  }

  async function renameProject(id: string) {
    if (!renameVal.trim()) { setRenamingId(null); return }
    await window.api.projects.rename(id, renameVal.trim())
    setProjects(await window.api.projects.list())
    setRenamingId(null)
  }

  return (
    <aside className="w-44 flex-none bg-black border-r border-editor-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-editor-border">
        <span className="label">Projects</span>
        <button
          onClick={createProject}
          className="text-[#c1c1c1] hover:text-editor-accent transition-colors"
          title="New project"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {projects.length === 0 && (
          <p className="text-xs text-[#c1c1c1] px-3 py-4 text-center">
            No projects yet.{' '}
            <button onClick={createProject} className="text-editor-accent hover:underline">Create one</button>
          </p>
        )}
        {projects.map(p => (
          <div
            key={p.id}
            onClick={() => openProject(p.id)}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
              currentProjectId === p.id
                ? 'bg-editor-accent-dim text-editor-accent'
                : 'text-editor-secondary hover:bg-editor-hover hover:text-editor-text'
            )}
          >
            <Folder size={12} className="flex-none" />

            {renamingId === p.id ? (
              <input
                autoFocus
                className="flex-1 bg-editor-elevated border border-editor-accent text-editor-text text-xs px-1 py-0.5 rounded min-w-0"
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onBlur={() => renameProject(p.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') renameProject(p.id)
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-xs truncate">{p.name}</span>
            )}

            {/* Actions */}
            <div className="nodrag flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={e => { e.stopPropagation(); setRenamingId(p.id); setRenameVal(p.name) }}
                className="text-[#c1c1c1] hover:text-editor-text"
              >
                <Edit2 size={10} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); deleteProject(p.id) }}
                className="text-[#c1c1c1] hover:text-red-400"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
