import { useState, useRef, useEffect } from 'react'
import { X, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { exportToMP4 } from '../../engine/exporter'
import { getStage } from '../../engine/stageRegistry'

type Phase = 'idle' | 'exporting' | 'done' | 'error'

export default function ExportModal() {
  const { project, setExportOpen, setPlayhead } = useEditorStore()

  const [phase,    setPhase]    = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [log,      setLog]      = useState('')
  const [savePath, setSavePath] = useState<string | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const cancelRef = useRef(false)

  // Clean up on unmount
  useEffect(() => () => { cancelRef.current = true }, [])

  if (!project) return null

  async function startExport() {
    if (!project) return
    cancelRef.current = false
    setPhase('exporting')
    setProgress(0)
    setLog('Initialising FFmpeg…')

    try {
      const blob = await exportToMP4({
        project,
        getStage,
        onProgress: (pct) => {
          if (cancelRef.current) return
          setProgress(pct)
          setLog(pct < 90 ? `Encoding frames… ${pct}%` : pct < 100 ? 'Muxing video…' : 'Done')
        },
        renderFrame: async (t) => {
          if (cancelRef.current) throw new Error('Cancelled')
          setPlayhead(t)
          // Let React re-render + Konva repaint
          await new Promise(r => setTimeout(r, 16))
        }
      })

      if (cancelRef.current) return
      blobRef.current = blob
      setPhase('done')
      setLog('Export complete!')
    } catch (err) {
      if (cancelRef.current) return
      console.error('Export failed', err)
      setPhase('error')
      setLog(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function handleSave() {
    if (!blobRef.current || !project) return
    const path = await window.api.dialog.saveVideo(`${project.name}.webm`)
    if (!path) return
    setSavePath(path)

    const url = URL.createObjectURL(blobRef.current)
    const a   = document.createElement('a')
    a.href    = url
    a.download = path.split(/[\\/]/).pop() ?? `${project.name}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleOpenFolder() {
    if (savePath) {
      const dir = savePath.replace(/[\\/][^\\/]+$/, '')
      await window.api.shell.openPath(dir)
    }
  }

  function handleClose() {
    cancelRef.current = true
    setExportOpen(false)
  }

  const fps      = project.fps
  const total    = project.scenes.reduce((s, sc) => s + sc.duration, 0)
  const frames   = Math.ceil(total * fps)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[420px] bg-editor-panel border border-editor-border rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <div className="flex items-center gap-2">
            <Download size={14} className="text-editor-accent" />
            <span className="text-sm font-medium text-editor-text">Export Video</span>
          </div>
          <button onClick={handleClose} className="text-editor-muted hover:text-editor-text transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Info */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-editor-elevated rounded px-3 py-2">
              <div className="label mb-1">Resolution</div>
              <div className="text-editor-text">{project.width} × {project.height}</div>
            </div>
            <div className="bg-editor-elevated rounded px-3 py-2">
              <div className="label mb-1">Duration</div>
              <div className="text-editor-text">{total.toFixed(1)}s</div>
            </div>
            <div className="bg-editor-elevated rounded px-3 py-2">
              <div className="label mb-1">Frames</div>
              <div className="text-editor-text">{frames} @ {fps}fps</div>
            </div>
          </div>

          {/* Progress */}
          {phase !== 'idle' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {phase === 'exporting' && <Loader2 size={13} className="text-editor-accent animate-spin" />}
                {phase === 'done'      && <CheckCircle size={13} className="text-green-400" />}
                {phase === 'error'     && <AlertCircle size={13} className="text-red-400" />}
                <span className="text-xs text-editor-secondary truncate">{log}</span>
              </div>

              <div className="h-1.5 rounded-full bg-editor-elevated overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-200',
                    phase === 'error' ? 'bg-red-500' : phase === 'done' ? 'bg-green-500' : 'bg-editor-accent'
                  ].join(' ')}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-editor-muted text-right">{progress}%</span>
            </div>
          )}

          {/* Note about rendering */}
          {phase === 'exporting' && (
            <p className="text-xs text-editor-muted bg-editor-elevated rounded px-3 py-2">
              Do not interact with the canvas during export — frames are being captured in sequence.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex items-center justify-end gap-2">
          {phase === 'idle' && (
            <>
              <button onClick={handleClose} className="text-xs px-3 py-1.5 rounded text-editor-secondary hover:text-editor-text hover:bg-editor-hover transition-colors">
                Cancel
              </button>
              <button
                onClick={startExport}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded bg-editor-accent text-white hover:bg-editor-accent-hover transition-colors"
              >
                <Download size={12} /> Start Export
              </button>
            </>
          )}

          {phase === 'exporting' && (
            <button
              onClick={handleClose}
              className="text-xs px-3 py-1.5 rounded text-red-400 hover:bg-red-900/30 transition-colors"
            >
              Cancel
            </button>
          )}

          {phase === 'done' && (
            <>
              {savePath && (
                <button
                  onClick={handleOpenFolder}
                  className="text-xs px-3 py-1.5 rounded text-editor-secondary hover:text-editor-text hover:bg-editor-hover transition-colors"
                >
                  Open Folder
                </button>
              )}
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded bg-green-600 text-white hover:bg-green-500 transition-colors"
              >
                <Download size={12} /> Save File
              </button>
              <button onClick={handleClose} className="text-xs px-3 py-1.5 rounded text-editor-secondary hover:text-editor-text hover:bg-editor-hover transition-colors">
                Close
              </button>
            </>
          )}

          {phase === 'error' && (
            <>
              <button onClick={() => setPhase('idle')} className="text-xs px-3 py-1.5 rounded text-editor-secondary hover:text-editor-text hover:bg-editor-hover transition-colors">
                Try Again
              </button>
              <button onClick={handleClose} className="text-xs px-3 py-1.5 rounded text-editor-secondary hover:text-editor-text hover:bg-editor-hover transition-colors">
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
