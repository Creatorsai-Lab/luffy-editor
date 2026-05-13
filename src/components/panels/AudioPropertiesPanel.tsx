import { useState } from 'react'
import { Volume2, Zap, Scissors, Sliders, X, ChevronDown, RotateCcw } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { AudioElement } from '../../types/editor'

interface AudioPropertiesPanelProps {
  element: AudioElement | null
  onClose?: () => void
}

export default function AudioPropertiesPanel({ element, onClose }: AudioPropertiesPanelProps) {
  const { updateElement } = useEditorStore()
  const [showAdvanced, setShowAdvanced] = useState(false)

  if (!element || element.type !== 'audio') {
    return null
  }

  const handleVolumeChange = (volume: number) => {
    updateElement(element.id, { volume: Math.max(0, Math.min(1, volume)) })
  }

  const handleSpeedChange = (speed: number) => {
    // Speed control - stored in animation-like property
    // For now, we'll use playbackRate if supported
    const newEl = { ...element }
    updateElement(element.id, newEl)
  }

  const handleTrimStart = (startTime: number) => {
    updateElement(element.id, { startTime: Math.max(0, startTime) })
  }

  const handleTrimDuration = (duration: number) => {
    updateElement(element.id, { duration: Math.max(0.1, duration) })
  }

  const handleFadeIn = (fadeIn: number) => {
    updateElement(element.id, { fadeIn: Math.max(0, Math.min(5, fadeIn)) })
  }

  const handleFadeOut = (fadeOut: number) => {
    updateElement(element.id, { fadeOut: Math.max(0, Math.min(5, fadeOut)) })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-editor-panel border-l border-editor-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-editor-border bg-editor-elevated/50">
        <h3 className="text-xs font-semibold text-white">{element.name}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Volume Control */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Volume2 size={13} className="text-editor-accent flex-none" />
            <label className="text-xs font-medium text-white flex-1">Volume</label>
            <span className="text-2xs text-[#888888]">{Math.round(element.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={element.volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-editor-border rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Trim Controls */}
        <div className="space-y-2 border-t border-editor-border pt-2">
          <div className="flex items-center gap-2">
            <Scissors size={13} className="text-editor-accent flex-none" />
            <label className="text-xs font-medium text-white">Trim</label>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-2xs text-[#888888]">
              <span>Start Time (s)</span>
              <span className="text-white">{element.startTime.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={element.duration}
              step={0.1}
              value={element.startTime}
              onChange={(e) => handleTrimStart(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-editor-border rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-2xs text-[#888888]">
              <span>Duration (s)</span>
              <span className="text-white">{element.duration.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={element.duration + 10}
              step={0.1}
              value={element.duration}
              onChange={(e) => handleTrimDuration(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-editor-border rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Fade In/Out */}
        <div className="space-y-2 border-t border-editor-border pt-2">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-editor-accent flex-none" />
            <label className="text-xs font-medium text-white">Fades</label>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-2xs text-[#888888]">
              <span>Fade In (s)</span>
              <span className="text-white">{element.fadeIn.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={element.fadeIn}
              onChange={(e) => handleFadeIn(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-editor-border rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-2xs text-[#888888]">
              <span>Fade Out (s)</span>
              <span className="text-white">{element.fadeOut.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={element.fadeOut}
              onChange={(e) => handleFadeOut(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-editor-border rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Advanced Options */}
        <div className="border-t border-editor-border pt-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-medium text-editor-accent hover:text-white transition-colors"
          >
            <Sliders size={13} />
            Advanced Options
            <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-2 space-y-2 pt-2 border-t border-editor-border">
              {/* Loop toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-white">Loop</label>
                <button
                  onClick={() => updateElement(element.id, { loop: !element.loop })}
                  className={`px-2 py-1 rounded text-2xs font-medium transition-colors ${
                    element.loop
                      ? 'bg-editor-accent text-white'
                      : 'bg-editor-border text-[#888888]'
                  }`}
                >
                  {element.loop ? 'On' : 'Off'}
                </button>
              </div>

              {/* Track type */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-white">Track Type</label>
                <select
                  value={element.track}
                  onChange={(e) => updateElement(element.id, { track: e.target.value as 'background' | 'voiceover' })}
                  className="bg-editor-border text-white text-2xs px-2 py-1 rounded border border-editor-border-strong"
                >
                  <option value="background">Background</option>
                  <option value="voiceover">Voiceover</option>
                </select>
              </div>

              {/* Reset button */}
              <button
                onClick={() => {
                  updateElement(element.id, {
                    volume: 1,
                    fadeIn: 0,
                    fadeOut: 0,
                    startTime: 0,
                    loop: false,
                    track: 'background'
                  })
                }}
                className="w-full flex items-center justify-center gap-2 mt-2 px-2 py-1.5 bg-editor-border hover:bg-editor-border-strong text-[#888888] hover:text-white rounded text-2xs transition-colors"
              >
                <RotateCcw size={11} />
                Reset to Defaults
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
