import { Grid3x3, Ruler, Eye, EyeOff, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import Tooltip from '../ui/Tooltip'
import { cn } from '../../utils/cn'

export default function CanvasToolbar() {
  const {
    showGrid, setShowGrid,
    showGuides, setShowGuides,
    showRulers, setShowRulers,
    showSafeArea, setShowSafeArea,
    canvasZoom, zoomIn, zoomOut, resetZoom
  } = useCanvasStore()

  return (
    <div className="absolute top-2 right-2 bg-editor-panel border border-editor-border rounded-lg shadow-lg flex items-center gap-1 p-1 z-10">
      {/* Grid toggle */}
      <Tooltip text="Toggle Grid (Ctrl+')">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={cn(
            'p-1.5 rounded transition-colors',
            showGrid
              ? 'bg-editor-accent text-white'
              : 'text-[#c1c1c1] hover:text-editor-text hover:bg-editor-hover'
          )}
        >
          <Grid3x3 size={14} />
        </button>
      </Tooltip>

      {/* Guides toggle */}
      <Tooltip text="Toggle Guides (Ctrl+;)">
        <button
          onClick={() => setShowGuides(!showGuides)}
          className={cn(
            'p-1.5 rounded transition-colors',
            showGuides
              ? 'bg-editor-accent text-white'
              : 'text-[#c1c1c1] hover:text-editor-text hover:bg-editor-hover'
          )}
        >
          <Ruler size={14} />
        </button>
      </Tooltip>

      {/* Rulers toggle */}
      <Tooltip text="Toggle Rulers (Ctrl+R)">
        <button
          onClick={() => setShowRulers(!showRulers)}
          className={cn(
            'p-1.5 rounded transition-colors',
            showRulers
              ? 'bg-editor-accent text-white'
              : 'text-[#c1c1c1] hover:text-editor-text hover:bg-editor-hover'
          )}
        >
          <Ruler size={14} className="rotate-90" />
        </button>
      </Tooltip>

      {/* Safe area toggle */}
      <Tooltip text="Toggle Safe Area">
        <button
          onClick={() => setShowSafeArea(!showSafeArea)}
          className={cn(
            'p-1.5 rounded transition-colors',
            showSafeArea
              ? 'bg-editor-accent text-white'
              : 'text-[#c1c1c1] hover:text-editor-text hover:bg-editor-hover'
          )}
        >
          {showSafeArea ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </Tooltip>

      <div className="w-px h-4 bg-editor-border mx-0.5" />

      {/* Zoom out */}
      <Tooltip text="Zoom Out (Ctrl+-)">
        <button
          onClick={zoomOut}
          className="p-1.5 rounded text-[#c1c1c1] hover:text-editor-text hover:bg-editor-hover transition-colors"
        >
          <ZoomOut size={14} />
        </button>
      </Tooltip>

      {/* Zoom level */}
      <Tooltip text="Reset Zoom (Ctrl+0)">
        <button
          onClick={resetZoom}
          className="px-2 py-1 text-xs text-editor-text hover:bg-editor-hover rounded transition-colors min-w-[45px] text-center"
        >
          {Math.round(canvasZoom * 100)}%
        </button>
      </Tooltip>

      {/* Zoom in */}
      <Tooltip text="Zoom In (Ctrl++)">
        <button
          onClick={zoomIn}
          className="p-1.5 rounded text-[#c1c1c1] hover:text-editor-text hover:bg-editor-hover transition-colors"
        >
          <ZoomIn size={14} />
        </button>
      </Tooltip>

      {/* Fit to screen */}
      <Tooltip text="Fit to Screen (Ctrl+1)">
        <button
          onClick={resetZoom}
          className="p-1.5 rounded text-[#c1c1c1] hover:text-editor-text hover:bg-editor-hover transition-colors"
        >
          <Maximize2 size={14} />
        </button>
      </Tooltip>
    </div>
  )
}
