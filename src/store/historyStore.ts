import { create } from 'zustand'
import type { Project } from '../types/editor'

interface HistoryEntry {
  id: string
  timestamp: number
  description: string
  state: Project
}

interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
  maxHistory: number
  canUndo: boolean
  canRedo: boolean
}

interface HistoryActions {
  pushHistory: (project: Project, description: string) => void
  undo: () => Project | null
  redo: () => Project | null
  clearHistory: () => void
  setMaxHistory: (max: number) => void
}

export const useHistoryStore = create<HistoryState & HistoryActions>((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  past: [],
  future: [],
  maxHistory: 100,
  canUndo: false,
  canRedo: false,

  // ── Actions ────────────────────────────────────────────────────────────────
  pushHistory: (project, description) => set(state => {
    // Deep clone the project state
    const clonedProject: Project = JSON.parse(JSON.stringify(project))
    
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      description,
      state: clonedProject
    }

    // Add to past, limit size
    const newPast = [...state.past, entry].slice(-state.maxHistory)

    return {
      past: newPast,
      future: [], // Clear future when new action is performed
      canUndo: true,
      canRedo: false
    }
  }),

  undo: () => {
    const { past } = get()
    if (past.length === 0) return null

    const entry = past[past.length - 1]
    const newPast = past.slice(0, -1)

    set(state => ({
      past: newPast,
      future: [entry, ...state.future],
      canUndo: newPast.length > 0,
      canRedo: true
    }))

    return entry.state
  },

  redo: () => {
    const { future } = get()
    if (future.length === 0) return null

    const entry = future[0]
    const newFuture = future.slice(1)

    set(state => ({
      past: [...state.past, entry],
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0
    }))

    return entry.state
  },

  clearHistory: () => set({
    past: [],
    future: [],
    canUndo: false,
    canRedo: false
  }),

  setMaxHistory: (max) => set(state => ({
    maxHistory: max,
    past: state.past.slice(-max)
  }))
}))
