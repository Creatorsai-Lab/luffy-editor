import { useState } from 'react'
import { X, Captions, Wand2, Plus, Trash2, Download, Film } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import type { VideoElement } from '../types/editor'
import { makeCue, type SubtitleCue } from './types'
import { cuesToSrt, fmt } from './srt'
import { transcriber } from './transcriber'

export default function SubtitleModal() {
  const { project, setSubtitleOpen } = useEditorStore()

  // All video elements across scenes — captions are generated per video.
  const videos: VideoElement[] = (project?.scenes ?? [])
    .flatMap(s => s.elements)
    .filter(e => e.type === 'video') as VideoElement[]

  const [videoId, setVideoId] = useState<string>(videos[0]?.id ?? '')
  const [cues, setCues] = useState<SubtitleCue[]>([])
  const [status, setStatus] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const selected = videos.find(v => v.id === videoId)

  function updateCue(id: string, patch: Partial<SubtitleCue>) {
    setCues(cs => cs.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }
  function addCue() {
    const last = cues[cues.length - 1]
    const start = last ? last.end : 0
    setCues(cs => [...cs, makeCue(start, start + 2, '')])
  }
  function removeCue(id: string) {
    setCues(cs => cs.filter(c => c.id !== id))
  }

  async function autoGenerate() {
    if (!selected) { setStatus('Add a video to the scene first.'); return }
    setBusy(true)
    setStatus('Analyzing audio…')
    try {
      const result = await transcriber.transcribe({
        videoSrc: selected.src,
        onProgress: (_pct, msg) => setStatus(msg),
      })
      setCues(result)
      setStatus(`Generated ${result.length} captions.`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Transcription failed.')
    } finally {
      setBusy(false)
    }
  }

  function exportSrt() {
    if (cues.length === 0) { setStatus('No captions to export.'); return }
    const blob = new Blob([cuesToSrt(cues)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project?.name ?? 'captions'}.srt`
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Exported .srt file.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) setSubtitleOpen(false) }}>
      <div className="bg-editor-panel border border-editor-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '90vw', height: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border flex-none">
          <div className="flex items-center gap-2">
            <Captions size={16} className="text-editor-accent" />
            <span className="text-base font-medium text-editor-text">Auto Captions</span>
            <span className="text-[10px] uppercase tracking-wider text-editor-secondary bg-editor-elevated px-1.5 py-0.5 rounded">beta</span>
          </div>
          <button onClick={() => setSubtitleOpen(false)} className="text-[#c9c4dd] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left controls */}
          <div className="w-72 flex-none border-r border-editor-border p-4 flex flex-col gap-3 overflow-y-auto">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-editor-secondary">Source video</span>
              {videos.length === 0 ? (
                <p className="text-xs text-[#c9c4dd] mt-2">No video in this project. Add a video element to caption it.</p>
              ) : (
                <select
                  value={videoId}
                  onChange={e => setVideoId(e.target.value)}
                  className="w-full mt-1.5 bg-editor-elevated border border-editor-border rounded text-xs text-editor-text px-2 py-1.5"
                >
                  {videos.map(v => <option key={v.id} value={v.id}>{v.name || 'Video'}</option>)}
                </select>
              )}
            </div>

            {selected && (
              <div className="flex items-center gap-2 text-xs text-[#c9c4dd] bg-editor-elevated rounded px-2.5 py-2">
                <Film size={13} /> {Math.round(selected.width)}×{Math.round(selected.height)}
              </div>
            )}

            <button
              onClick={autoGenerate}
              disabled={busy || !selected}
              className="flex items-center justify-center gap-2 text-sm py-2.5 rounded bg-editor-accent text-white hover:bg-editor-accent-hover transition-colors disabled:opacity-50"
            >
              <Wand2 size={14} /> {busy ? 'Working…' : 'Auto-generate captions'}
            </button>
            {!transcriber.available && (
              <p className="text-[11px] text-yellow-500/90 leading-relaxed">
                On-device speech recognition is coming soon. For now you can add and
                edit captions manually, then export an .srt file.
              </p>
            )}

            <div className="border-t border-editor-border pt-3 flex flex-col gap-2">
              <button onClick={addCue}
                className="flex items-center justify-center gap-2 text-xs py-2 rounded bg-editor-elevated border border-editor-border text-editor-text hover:bg-editor-hover transition-colors">
                <Plus size={13} /> Add caption
              </button>
              <button onClick={exportSrt}
                className="flex items-center justify-center gap-2 text-xs py-2 rounded bg-editor-elevated border border-editor-border text-editor-text hover:bg-editor-hover transition-colors">
                <Download size={13} /> Export .srt
              </button>
            </div>

            {status && <p className="text-[11px] text-[#c9c4dd] mt-1">{status}</p>}
          </div>

          {/* Cue editor */}
          <div className="flex-1 overflow-y-auto p-4">
            {cues.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-editor-secondary text-center">
                  No captions yet.<br />Auto-generate or add one to begin.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-w-3xl">
                {cues.slice().sort((a, b) => a.start - b.start).map((c, i) => (
                  <div key={c.id} className="flex items-start gap-2 bg-editor-elevated border border-editor-border rounded-lg p-2.5">
                    <span className="text-[11px] text-editor-secondary w-6 pt-2 text-right tabular-nums">{i + 1}</span>
                    <div className="flex flex-col gap-1.5 w-28 flex-none">
                      <label className="text-[10px] text-editor-secondary">Start ({fmt(c.start)})</label>
                      <input type="number" min={0} step={0.1} value={c.start}
                        onChange={e => updateCue(c.id, { start: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className="bg-editor-base border border-editor-border rounded text-xs text-editor-text px-2 py-1" />
                      <label className="text-[10px] text-editor-secondary">End ({fmt(c.end)})</label>
                      <input type="number" min={0} step={0.1} value={c.end}
                        onChange={e => updateCue(c.id, { end: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className="bg-editor-base border border-editor-border rounded text-xs text-editor-text px-2 py-1" />
                    </div>
                    <textarea value={c.text} rows={3} placeholder="Caption text…"
                      onChange={e => updateCue(c.id, { text: e.target.value })}
                      className="flex-1 bg-editor-base border border-editor-border rounded text-sm text-editor-text px-2 py-1.5 resize-none" />
                    <button onClick={() => removeCue(c.id)} className="text-[#c9c4dd] hover:text-red-400 transition-colors pt-1.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
