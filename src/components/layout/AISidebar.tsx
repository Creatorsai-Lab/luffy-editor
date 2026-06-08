import { BrainCircuit, DraftingCompass } from 'lucide-react'

// Leftmost sidebar — placeholder for an upcoming AI assistant.
// The input is intentionally non-functional for now.
export default function AISidebar() {
  return (
    <aside className="w-64 flex-none bg-[#171717] flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-editor-border flex-none">
        <BrainCircuit size={15} className="text-editor-accent" />
        <span className="text-xs font-medium text-editor-text">AI Agents</span>
      </div>

      {/* Empty body for now */}
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-[11px] text-editor-secondary text-center leading-relaxed">
          Ask AI agents to build or edit your scene...</p>
      </div>

      {/* Sample, non-working input bar */}
      <div title='Under testing, will available in next patch' className="p-3 border-t border-editor-border flex-none">
        <div className="flex items-center gap-1.5 bg-editor-elevated border border-editor-border rounded-lg px-2.5 py-2 opacity-70">
          <input
            type="text"
            disabled
            placeholder="Describe what you edit"
            className="flex-1 bg-transparent text-xs text-editor-text placeholder:text-editor-secondary outline-none cursor-not-allowed"
          />
          <button
            disabled
            className="flex-none text-editor-secondary cursor-not-allowed"
          >
            <DraftingCompass size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
