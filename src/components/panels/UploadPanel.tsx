import { useState } from 'react'
import { Upload, Image, Film, Trash2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { makeImage } from '../../utils/defaults'
import { cn } from '../../utils/cn'

export default function UploadPanel() {
  const { project, addAsset, removeAsset, addElement } = useEditorStore()
  const [loading, setLoading] = useState(false)

  async function handleUpload() {
    if (!project) return
    const path = await window.api.dialog.openFile([
      { name: 'Images & Videos', extensions: ['png','jpg','jpeg','gif','webp','mp4','webm','mov'] }
    ])
    if (!path) return
    setLoading(true)
    try {
      const asset = await window.api.assets.upload(project.id, path)
      const ext = asset.filename.split('.').pop()?.toLowerCase() ?? ''
      const isVideo = ['mp4','webm','mov'].includes(ext)
      addAsset({
        id:       asset.id,
        filename: asset.filename,
        path:     asset.path,
        type:     isVideo ? 'video' : 'image',
        name:     asset.filename
      })
    } catch (e) {
      console.error('Upload failed', e)
    } finally {
      setLoading(false)
    }
  }

  const assets = project?.assets ?? []

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-editor-border">
        <Upload size={12} className="text-editor-accent" />
        <span className="text-xs font-medium text-editor-text">Assets</span>
      </div>

      <div className="px-3 py-2 border-b border-editor-border">
        <button
          onClick={handleUpload}
          disabled={loading || !project}
          className="w-full text-xs py-2 bg-editor-accent-dim text-editor-accent border border-editor-accent rounded hover:bg-editor-accent hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? 'Uploading…' : '+ Upload Image / Video'}
        </button>
      </div>

      {assets.length === 0 && (
        <p className="text-xs text-editor-muted px-3 py-4 text-center">No assets yet.</p>
      )}

      <div className="flex flex-col gap-px p-2">
        {assets.map(a => (
          <div
            key={a.id}
            className="group flex items-center gap-2 p-2 rounded hover:bg-editor-hover cursor-pointer transition-colors"
            onClick={() => addElement(makeImage(100, 100, a.path, a.id))}
          >
            {a.type === 'video' ? <Film size={12} className="text-editor-muted flex-none" /> : <Image size={12} className="text-editor-muted flex-none" />}
            <span className="flex-1 text-xs text-editor-secondary truncate">{a.name}</span>
            <button
              onClick={e => { e.stopPropagation(); removeAsset(a.id) }}
              className="opacity-0 group-hover:opacity-100 text-editor-muted hover:text-red-400 transition-all"
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
