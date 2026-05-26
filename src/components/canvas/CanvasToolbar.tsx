import { Grid3x3, Eye, EyeOff } from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import Tooltip from '../ui/Tooltip'
import { cn } from '../../utils/cn'

export default function CanvasToolbar() {
  const {
    showGrid, setShowGrid,
    showSafeArea, setShowSafeArea,
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
              ? 'bg-red text-white'
              : 'text-[#c1c1c1] hover:text-editor-text hover:bg-editor-hover'
          )}
        >
          <Grid3x3 size={14} />
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
    </div>
  )
}
