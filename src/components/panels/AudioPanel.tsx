import { useState } from 'react'
import { Music, Trash2, Plus } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { AssetMeta } from '../../types/editor'

export default function AudioPanel() {
  const { project, addAsset, removeAsset } = useEditorStore()
  const [uploading, setUploading] = useState(false)

  const audioAssets = (project?.assets ?? []).filter(a => a.type === 'audio')

  async function handleUpload() {
    try {
      setUploading(true)
      const result = await window.api.dialog.openFile([
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a'] }
      ])

      if (!result) return

      const filePath = result
      const fileName = filePath.split(/[\\/]/).pop() || 'audio'

      // Create asset metadata
      const asset: AssetMeta = {
        id: `audio-${Date.now()}`,
        filename: fileName,
        path: filePath,
        type: 'audio',
        name: fileName.replace(/\.[^.]+$/, ''),
        duration: 0
      }

      addAsset(asset)
    } catch (err) {
      console.error('Failed to upload audio:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader icon={<Music size={12} />} title="Audio Manager" />

      <div className="flex-1 overflow-y-auto">
        {audioAssets.length === 0 ? (
          <p className="text-xs text-[#c1c1c1] px-3 py-3">
            No audio files uploaded. Click the button below to add audio.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 px-3 py-2">
            {audioAssets.map(asset => (
              <div
                key={asset.id}
                className="flex items-center justify-between gap-2 bg-editor-elevated rounded p-2 border border-editor-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-editor-text truncate">{asset.name}</p>
                  <p className="text-xs text-[#c1c1c1] truncate">{asset.filename}</p>
                </div>
                <button
                  onClick={() => removeAsset(asset.id)}
                  className="text-[#c1c1c1] hover:text-red-400 transition-colors flex-none"
                  title="Delete audio"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="border-t border-editor-border p-3 bg-editor-elevated/50">
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-editor-accent hover:bg-editor-accent-hover disabled:bg-editor-muted text-white rounded px-3 py-2 text-xs font-medium transition-colors"
        >
          <Plus size={14} />
          {uploading ? 'Uploading...' : 'Add Audio'}
        </button>
      </div>
    </div>
  )
}

function PanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-editor-border bg-editor-elevated/30">
      {icon}
      <span className="text-xs font-semibold text-editor-text">{title}</span>
    </div>
  )
}
