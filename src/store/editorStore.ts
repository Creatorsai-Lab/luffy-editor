import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type {
  Project, Scene, EditorElement, ElementAnimation,
  Background, SceneTransition, AssetMeta,
  ActiveTool, ActivePanel
} from '../types/editor'
import { makeScene, makeProject } from '../utils/defaults'
import { useHistoryStore } from './historyStore'

interface EditorState {
  project:           Project | null
  currentProjectId:  string | null
  currentSceneId:    string | null
  selectedIds:       string[]
  playhead:          number
  isPlaying:         boolean
  zoom:              number
  activeTool:        ActiveTool
  activePanel:       ActivePanel
  isDirty:           boolean
  codeModalOpen:     boolean
  codeModalElemId:   string | null
  previewOpen:       boolean
  exportOpen:        boolean
  exportProgress:    number
  timelineZoom:      number
  snapEnabled:       boolean
}

interface EditorActions {
  // Project
  loadProject:      (project: Project) => void
  closeProject:     () => void
  setProjectName:   (name: string) => void
  setCanvasSize:    (w: number, h: number) => void

  // Scenes
  addScene:         () => void
  duplicateScene:   (id: string) => void
  removeScene:      (id: string) => void
  reorderScenes:    (from: number, to: number) => void
  setCurrentScene:  (id: string) => void
  updateScene:      (id: string, patch: Partial<Pick<Scene, 'name' | 'duration'>>) => void
  setBackground:    (id: string, bg: Background) => void
  setTransition:    (id: string, tr: SceneTransition) => void

  // Elements
  addElement:       (el: EditorElement) => void
  updateElement:    (id: string, patch: Partial<EditorElement>) => void
  removeElement:    (id: string) => void
  duplicateElement: (id: string) => void
  bringForward:     (id: string) => void
  sendBackward:     (id: string) => void
  bringToFront:     (id: string) => void
  sendToBack:       (id: string) => void

  // Selection
  selectElement:    (id: string, multi?: boolean) => void
  deselectAll:      () => void

  // Animations
  addAnimation:     (elId: string, anim: ElementAnimation) => void
  updateAnimation:  (elId: string, animId: string, patch: Partial<ElementAnimation>) => void
  removeAnimation:  (elId: string, animId: string) => void

  // Playback
  setPlayhead:      (t: number) => void
  play:             () => void
  pause:            () => void
  stop:             () => void

  // UI
  setZoom:          (z: number) => void
  setActiveTool:    (t: ActiveTool) => void
  setActivePanel:   (p: ActivePanel) => void
  openCodeModal:    (elemId?: string) => void
  closeCodeModal:   () => void
  setPreviewOpen:   (v: boolean) => void
  setExportOpen:    (v: boolean) => void
  setExportProgress:(v: number) => void
  setTimelineZoom:  (z: number) => void
  setSnapEnabled:   (enabled: boolean) => void

  // Assets
  addAsset:         (a: AssetMeta) => void
  removeAsset:      (id: string) => void
  markDirty:        () => void
  markClean:        () => void

  // History
  undo:             () => void
  redo:             () => void
  saveHistory:      (description: string) => void

  // Getters
  getCurrentScene:  () => Scene | null
  getSelectedEls:   () => EditorElement[]
  getTotalDuration: () => number
  getSceneAtTime:   (t: number) => { scene: Scene; localTime: number } | null
}

export const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      project:          null,
      currentProjectId: null,
      currentSceneId:   null,
      selectedIds:      [],
      playhead:         0,
      isPlaying:        false,
      zoom:             1,
      activeTool:       'select',
      activePanel:      null,
      isDirty:          false,
      codeModalOpen:    false,
      codeModalElemId:  null,
      previewOpen:      false,
      exportOpen:       false,
      exportProgress:   0,
      timelineZoom:     1,
      snapEnabled:      true,

      // ── Project ────────────────────────────────────────────────────────────
      loadProject: (project) => set(s => {
        s.project          = project
        s.currentProjectId = project.id
        s.currentSceneId   = project.scenes[0]?.id ?? null
        s.selectedIds      = []
        s.playhead         = 0
        s.isPlaying        = false
        s.isDirty          = false
      }),

      closeProject: () => set(s => {
        s.project          = null
        s.currentProjectId = null
        s.currentSceneId   = null
        s.selectedIds      = []
        s.playhead         = 0
        s.isPlaying        = false
        s.isDirty          = false
      }),

      setProjectName: (name) => set(s => {
        if (s.project) { s.project.name = name; s.isDirty = true }
      }),

      setCanvasSize: (w, h) => set(s => {
        if (s.project) { s.project.width = w; s.project.height = h; s.isDirty = true }
      }),

      // ── Scenes ─────────────────────────────────────────────────────────────
      addScene: () => set(s => {
        if (!s.project) return
        const scene = makeScene(s.project.scenes.length + 1)
        s.project.scenes.push(scene)
        s.currentSceneId = scene.id
        s.isDirty = true
      }, false, 'addScene'),

      duplicateScene: (id) => set(s => {
        if (!s.project) return
        const idx = s.project.scenes.findIndex(sc => sc.id === id)
        if (idx < 0) return
        const clone: Scene = JSON.parse(JSON.stringify(s.project.scenes[idx]))
        clone.id   = uuid()
        clone.name = clone.name + ' Copy'
        clone.elements = clone.elements.map(e => ({ ...e, id: uuid() }))
        s.project.scenes.splice(idx + 1, 0, clone)
        s.currentSceneId = clone.id
        s.isDirty = true
      }, false, 'duplicateScene'),

      removeScene: (id) => set(s => {
        if (!s.project || s.project.scenes.length <= 1) return
        const idx = s.project.scenes.findIndex(sc => sc.id === id)
        s.project.scenes.splice(idx, 1)
        if (s.currentSceneId === id) {
          s.currentSceneId = s.project.scenes[Math.max(0, idx - 1)].id
        }
        s.isDirty = true
      }, false, 'removeScene'),

      reorderScenes: (from, to) => set(s => {
        if (!s.project) return
        const [scene] = s.project.scenes.splice(from, 1)
        s.project.scenes.splice(to, 0, scene)
        s.isDirty = true
      }),

      setCurrentScene: (id) => set(s => {
        s.currentSceneId = id
        s.selectedIds    = []
      }),

      updateScene: (id, patch) => set(s => {
        if (!s.project) return
        const sc = s.project.scenes.find(x => x.id === id)
        if (sc) { Object.assign(sc, patch); s.isDirty = true }
      }),

      setBackground: (id, bg) => set(s => {
        if (!s.project) return
        const sc = s.project.scenes.find(x => x.id === id)
        if (sc) { sc.background = bg; s.isDirty = true }
      }),

      setTransition: (id, tr) => set(s => {
        if (!s.project) return
        const sc = s.project.scenes.find(x => x.id === id)
        if (sc) { sc.transition = tr; s.isDirty = true }
      }),

      // ── Elements ──────────────────────────────────────────────────────────
      addElement: (el) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        el.zIndex = sc.elements.length
        sc.elements.push(el as EditorElement)
        s.selectedIds = [el.id]
        s.isDirty = true
      }),

      updateElement: (id, patch) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        const el = sc.elements.find(e => e.id === id)
        if (el) { Object.assign(el, patch); s.isDirty = true }
      }),

      removeElement: (id) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        sc.elements = sc.elements.filter(e => e.id !== id)
        s.selectedIds = s.selectedIds.filter(x => x !== id)
        s.isDirty = true
      }),

      duplicateElement: (id) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        const el = sc.elements.find(e => e.id === id)
        if (!el) return
        const clone = JSON.parse(JSON.stringify(el))
        clone.id = uuid()
        clone.x += 16; clone.y += 16
        clone.zIndex = sc.elements.length
        sc.elements.push(clone)
        s.selectedIds = [clone.id]
        s.isDirty = true
      }),

      bringForward: (id) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        const el = sc.elements.find(e => e.id === id)
        if (!el) return
        const above = sc.elements.filter(e => e.zIndex === el.zIndex + 1)
        above.forEach(e => { e.zIndex -= 1 })
        el.zIndex += 1
        s.isDirty = true
      }),

      sendBackward: (id) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        const el = sc.elements.find(e => e.id === id)
        if (!el || el.zIndex === 0) return
        const below = sc.elements.filter(e => e.zIndex === el.zIndex - 1)
        below.forEach(e => { e.zIndex += 1 })
        el.zIndex -= 1
        s.isDirty = true
      }),

      bringToFront: (id) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        const sorted = [...sc.elements].sort((a, b) => a.zIndex - b.zIndex)
        const idx = sorted.findIndex(e => e.id === id)
        if (idx < 0) return
        sorted.push(sorted.splice(idx, 1)[0])
        sorted.forEach((e, i) => {
          const el = sc.elements.find(x => x.id === e.id)
          if (el) el.zIndex = i
        })
        s.isDirty = true
      }),

      sendToBack: (id) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        const sorted = [...sc.elements].sort((a, b) => a.zIndex - b.zIndex)
        const idx = sorted.findIndex(e => e.id === id)
        if (idx < 0) return
        sorted.unshift(sorted.splice(idx, 1)[0])
        sorted.forEach((e, i) => {
          const el = sc.elements.find(x => x.id === e.id)
          if (el) el.zIndex = i
        })
        s.isDirty = true
      }),

      // ── Selection ─────────────────────────────────────────────────────────
      selectElement: (id, multi) => set(s => {
        if (multi) {
          if (s.selectedIds.includes(id)) s.selectedIds = s.selectedIds.filter(x => x !== id)
          else s.selectedIds.push(id)
        } else {
          s.selectedIds = [id]
        }
      }),

      deselectAll: () => set(s => { s.selectedIds = [] }),

      // ── Animations ────────────────────────────────────────────────────────
      addAnimation: (elId, anim) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        const el = sc.elements.find(e => e.id === elId)
        if (el) { el.animations.push(anim as ElementAnimation); s.isDirty = true }
      }),

      updateAnimation: (elId, animId, patch) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        const el   = sc.elements.find(e => e.id === elId)
        if (!el) return
        const anim = el.animations.find(a => a.id === animId)
        if (anim) { Object.assign(anim, patch); s.isDirty = true }
      }),

      removeAnimation: (elId, animId) => set(s => {
        if (!s.project || !s.currentSceneId) return
        const sc = s.project.scenes.find(x => x.id === s.currentSceneId)
        if (!sc) return
        const el = sc.elements.find(e => e.id === elId)
        if (el) { el.animations = el.animations.filter(a => a.id !== animId); s.isDirty = true }
      }),

      // ── Playback ──────────────────────────────────────────────────────────
      setPlayhead: (t) => set(s => { s.playhead = t }),
      play:        ()  => set(s => { s.isPlaying = true }),
      pause:       ()  => set(s => { s.isPlaying = false }),
      stop:        ()  => set(s => { s.isPlaying = false; s.playhead = 0 }),

      // ── UI ────────────────────────────────────────────────────────────────
      setZoom:          (z) => set(s => { s.zoom = z }),
      setActiveTool:    (t) => set(s => { s.activeTool = t }),
      setActivePanel:   (p) => set(s => { s.activePanel = p }),
      openCodeModal:    (id) => set(s => { s.codeModalOpen = true; s.codeModalElemId = id ?? null }),
      closeCodeModal:   ()  => set(s => { s.codeModalOpen = false; s.codeModalElemId = null }),
      setPreviewOpen:   (v) => set(s => { s.previewOpen = v }),
      setExportOpen:    (v) => set(s => { s.exportOpen = v }),
      setExportProgress:(v) => set(s => { s.exportProgress = v }),
      setTimelineZoom:  (z) => set(s => { s.timelineZoom = Math.max(0.1, Math.min(5, z)) }),
      setSnapEnabled:   (enabled) => set(s => { s.snapEnabled = enabled }),

      markDirty:        ()  => set(s => { s.isDirty = true }),
      markClean:        ()  => set(s => { s.isDirty = false }),

      // ── History ────────────────────────────────────────────────────────────
      saveHistory: (description) => {
        const { project } = get()
        if (project) {
          useHistoryStore.getState().pushHistory(project, description)
        }
      },

      undo: () => {
        const previousState = useHistoryStore.getState().undo()
        if (previousState) {
          isUndoRedo = true
          set(s => { s.project = previousState; s.isDirty = true })
          isUndoRedo = false
        }
      },

      redo: () => {
        const nextState = useHistoryStore.getState().redo()
        if (nextState) {
          isUndoRedo = true
          set(s => { s.project = nextState; s.isDirty = true })
          isUndoRedo = false
        }
      },

      // ── Assets ────────────────────────────────────────────────────────────
      addAsset: (a) => set(s => {
        if (!s.project) return
        s.project.assets.push(a)
        s.isDirty = true
      }),
      removeAsset: (id) => set(s => {
        if (!s.project) return
        s.project.assets = s.project.assets.filter(a => a.id !== id)
        s.isDirty = true
      }),

      // ── Getters ───────────────────────────────────────────────────────────
      getCurrentScene: () => {
        const { project, currentSceneId } = get()
        if (!project || !currentSceneId) return null
        return project.scenes.find(s => s.id === currentSceneId) ?? null
      },

      getSelectedEls: () => {
        const { project, currentSceneId, selectedIds } = get()
        if (!project || !currentSceneId) return []
        const sc = project.scenes.find(s => s.id === currentSceneId)
        if (!sc) return []
        return sc.elements.filter(e => selectedIds.includes(e.id))
      },

      getTotalDuration: () => {
        const { project } = get()
        if (!project) return 0
        return project.scenes.reduce((sum, s) => sum + s.duration, 0)
      },

      getSceneAtTime: (t) => {
        const { project } = get()
        if (!project || project.scenes.length === 0) return null
        let elapsed = 0
        for (const scene of project.scenes) {
          if (t < elapsed + scene.duration) {
            return { scene, localTime: t - elapsed }
          }
          elapsed += scene.duration
        }
        // Clamp to last scene's final frame (handles t === totalDuration exactly)
        const last = project.scenes[project.scenes.length - 1]
        return { scene: last, localTime: last.duration }
      }
    }))
  )
)

// ── Single history-save mechanism (debounced project subscriber) ──────────────
// isUndoRedo is set synchronously around undo()/redo() set() calls so the
// subscriber can skip pushing a new history entry for those changes.
let lastProject: Project | null = null
let saveTimeout: NodeJS.Timeout | null = null
let isUndoRedo = false

useEditorStore.subscribe(
  (state) => state.project,
  (project) => {
    if (isUndoRedo) {
      // Undo/redo change — cancel any pending save and update baseline
      if (saveTimeout) clearTimeout(saveTimeout)
      lastProject = project
      return
    }
    if (!project || !lastProject) {
      lastProject = project
      return
    }
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      if (!project || !lastProject) return
      const currentStr = JSON.stringify(project)
      if (currentStr !== JSON.stringify(lastProject)) {
        useHistoryStore.getState().pushHistory(project, 'Edit')
        lastProject = JSON.parse(currentStr)
      }
    }, 500)
  }
)
