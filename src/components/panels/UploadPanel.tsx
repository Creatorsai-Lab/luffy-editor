import { useState, useRef, useEffect } from 'react'
import { Upload, Image, Film, Music, Trash2, FileImage } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { makeImage, makeVideo, makeAudio } from '../../utils/defaults'
import { cn } from '../../utils/cn'
import { toFileUrl } from '../../utils/pathUtils'

export default function UploadPanel() {
  const { project, addAsset, removeAsset, addElement } = useEditorStore()
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  async function handleUpload() {
    if (!project) return
    const path = await window.api.dialog.openFile([
      { name: 'Media Files', extensions: ['png','jpg','jpeg','gif','webp','mp4','webm','mov','mp3','wav','ogg','m4a'] }
    ])
    if (!path) return
    await uploadFile(path)
  }

  async function uploadFile(path: string) {
    if (!project) return
    setLoading(true)
    try {
      const asset = await window.api.assets.upload(project.id, path)
      const ext = asset.filename.split('.').pop()?.toLowerCase() ?? ''
      const isVideo = ['mp4','webm','mov'].includes(ext)
      const isAudio = ['mp3','wav','ogg','m4a'].includes(ext)
      
      addAsset({
        id:       asset.id,
        filename: asset.filename,
        path:     asset.path,
        type:     isAudio ? 'audio' : isVideo ? 'video' : 'image',
        name:     asset.filename
      })
    } catch (e) {
      console.error('Upload failed', e)
    } finally {
      setLoading(false)
    }
  }

  // Drag and drop handlers
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)

      const files = Array.from(e.dataTransfer?.files || [])
      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
        const validExts = ['png','jpg','jpeg','gif','webp','mp4','webm','mov','mp3','wav','ogg','m4a']
        if (validExts.includes(ext)) {
          await uploadFile(file.path)
        }
      }
    }

    dropZone.addEventListener('dragover', handleDragOver)
    dropZone.addEventListener('dragleave', handleDragLeave)
    dropZone.addEventListener('drop', handleDrop)

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver)
      dropZone.removeEventListener('dragleave', handleDragLeave)
      dropZone.removeEventListener('drop', handleDrop)
    }
  }, [project])

  const assets = project?.assets ?? []

  function handleAddToCanvas(asset: typeof assets[0]) {
    if (asset.type === 'audio') {
      addElement(makeAudio(asset.path, asset.id, asset.duration || 30))
    } else if (asset.type === 'video') {
      addElement(makeVideo(100, 100, asset.path, asset.id))
    } else {
      addElement(makeImage(100, 100, asset.path, asset.id))
    }
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-editor-border">
        <Upload size={12} className="text-editor-accent" />
        <span className="text-xs font-medium text-editor-text">Assets</span>
      </div>

      {/* Upload button */}
      <div className="px-3 py-2 border-b border-editor-border">
        <button
          onClick={handleUpload}
          disabled={loading || !project}
          className="w-full text-xs py-2 bg-editor-accent-dim text-editor-accent border border-editor-accent rounded hover:bg-editor-accent hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? 'Uploading…' : '+ Upload Media'}
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        className={cn(
          'mx-3 my-2 p-4 border-2 border-dashed rounded-lg transition-colors',
          dragOver
            ? 'border-editor-accent bg-editor-accent-dim'
            : 'border-editor-border bg-editor-elevated'
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <FileImage size={24} className={dragOver ? 'text-editor-accent' : 'text-[#c1c1c1]'} />
          <p className="text-xs text-editor-secondary">
            Drag & drop files here
          </p>
          <p className="text-2xs text-[#c1c1c1]">
            PNG, JPG, GIF, WebP, MP4, WebM, MOV, MP3, WAV, OGG, M4A
          </p>
        </div>
      </div>

      {/* Assets list */}
      {assets.length === 0 && (
        <p className="text-xs text-[#c1c1c1] px-3 py-4 text-center">No assets yet.</p>
      )}

      <div className="grid grid-cols-2 gap-2 p-2">
        {assets.map(a => {
          // Use toFileUrl utility for proper conversion
          const displayPath = toFileUrl(a.path)
          
          return (
            <div
              key={a.id}
              className="group relative aspect-video bg-editor-elevated rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-editor-accent transition-all"
              onClick={() => handleAddToCanvas(a)}
            >
              {/* Thumbnail */}
              <div className="absolute inset-0 flex items-center justify-center bg-editor-panel">
                {a.type === 'audio' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Music size={32} className="text-[#c1c1c1]" />
                    <span className="text-2xs text-[#c1c1c1]">Audio</span>
                  </div>
                ) : a.type === 'video' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Film size={32} className="text-[#c1c1c1]" />
                    <span className="text-2xs text-[#c1c1c1]">Video</span>
                  </div>
                ) : (
                  <img
                    src={displayPath}
                    alt={a.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('[UploadPanel] Failed to load thumbnail:', displayPath, 'Original path:', a.path)
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="flex flex-col items-center justify-center w-full h-full gap-2"><svg class="w-8 h-8 text-[#c1c1c1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-2xs text-[#c1c1c1]">Image</span></div>'
                      }
                    }}
                  />
                )}
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs text-white font-medium">Add to Canvas</span>
              </div>

              {/* Type badge */}
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-2xs text-white">
                {a.type === 'audio' ? 'AUDIO' : a.type === 'video' ? 'VIDEO' : 'IMAGE'}
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeAsset(a.id) }}
                className="absolute top-1 right-1 p-1 bg-black/70 rounded opacity-0 group-hover:opacity-100 text-white hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>

              {/* Filename */}
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/70">
                <p className="text-2xs text-white truncate">{a.name}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
