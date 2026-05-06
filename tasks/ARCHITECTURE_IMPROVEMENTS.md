# Architecture Improvements & Best Practices

## 🏗️ Current Architecture Assessment

### Strengths:
✅ Clean separation of concerns (store, components, engine, types)
✅ Well-structured state management with Zustand + Immer
✅ Type-safe with TypeScript
✅ Modular component structure
✅ Good animation engine design
✅ Scene-based architecture is solid

### Weaknesses:
❌ No undo/redo system
❌ No error boundaries
❌ Large components (EditorCanvas 300+ lines)
❌ No performance optimization (memoization, virtualization)
❌ No testing infrastructure
❌ Unused imports and dead code
❌ No strict TypeScript mode
❌ State stored in Zustand (performance issues with large projects)

---

## 🎯 Recommended Architecture Changes

### 1. Implement Command Pattern for Undo/Redo

#### Current Problem:
No way to undo/redo actions. This is critical for any editor.

#### Solution:
```typescript
// src/store/commandStore.ts
interface Command {
  execute(): void
  undo(): void
  redo(): void
  merge?(other: Command): boolean  // For merging similar commands
  description: string
}

class UpdateElementCommand implements Command {
  constructor(
    private elementId: string,
    private oldProps: Partial<EditorElement>,
    private newProps: Partial<EditorElement>
  ) {}
  
  execute() {
    useEditorStore.getState().updateElement(this.elementId, this.newProps)
  }
  
  undo() {
    useEditorStore.getState().updateElement(this.elementId, this.oldProps)
  }
  
  redo() {
    this.execute()
  }
  
  merge(other: Command): boolean {
    if (other instanceof UpdateElementCommand && 
        other.elementId === this.elementId) {
      // Merge consecutive updates to same element
      this.newProps = { ...this.newProps, ...other.newProps }
      return true
    }
    return false
  }
  
  description = `Update element ${this.elementId}`
}

interface CommandState {
  history: Command[]
  currentIndex: number
  maxHistory: number
}

interface CommandActions {
  execute: (command: Command) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
}

export const useCommandStore = create<CommandState & CommandActions>((set, get) => ({
  history: [],
  currentIndex: -1,
  maxHistory: 100,
  
  execute: (command) => {
    command.execute()
    
    set(state => {
      // Remove any commands after current index (branching)
      const newHistory = state.history.slice(0, state.currentIndex + 1)
      
      // Try to merge with previous command
      if (newHistory.length > 0) {
        const lastCommand = newHistory[newHistory.length - 1]
        if (lastCommand.merge && lastCommand.merge(command)) {
          return { history: newHistory }
        }
      }
      
      // Add new command
      newHistory.push(command)
      
      // Limit history size
      if (newHistory.length > state.maxHistory) {
        newHistory.shift()
      }
      
      return {
        history: newHistory,
        currentIndex: newHistory.length - 1
      }
    })
  },
  
  undo: () => {
    const { history, currentIndex } = get()
    if (currentIndex >= 0) {
      history[currentIndex].undo()
      set({ currentIndex: currentIndex - 1 })
    }
  },
  
  redo: () => {
    const { history, currentIndex } = get()
    if (currentIndex < history.length - 1) {
      history[currentIndex + 1].redo()
      set({ currentIndex: currentIndex + 1 })
    }
  },
  
  canUndo: () => get().currentIndex >= 0,
  canRedo: () => get().currentIndex < get().history.length - 1,
  clearHistory: () => set({ history: [], currentIndex: -1 })
}))
```

#### Usage:
```typescript
// Instead of:
updateElement(id, { x: 100 })

// Do:
const command = new UpdateElementCommand(id, { x: oldX }, { x: 100 })
executeCommand(command)

// Keyboard shortcuts:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

---

### 2. Add Error Boundaries

#### Current Problem:
Any error crashes the entire app. No graceful error handling.

#### Solution:
```typescript
// src/components/ErrorBoundary.tsx
import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-editor-muted mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-editor-accent rounded"
          >
            Try Again
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Usage in App.tsx:
<ErrorBoundary>
  <EditorCanvas />
</ErrorBoundary>
```

---

### 3. Split Large Components

#### Current Problem:
EditorCanvas is 300+ lines. Hard to maintain and test.

#### Solution:
```typescript
// src/components/canvas/EditorCanvas.tsx (main)
export default function EditorCanvas() {
  return (
    <CanvasContainer>
      <CanvasStage>
        <BackgroundLayer />
        <ElementsLayer />
        <TransformerLayer />
      </CanvasStage>
      <CanvasOverlay />
    </CanvasContainer>
  )
}

// src/components/canvas/CanvasContainer.tsx
export function CanvasContainer({ children }: Props) {
  const { scale, offsetX, offsetY } = useCanvasLayout()
  return (
    <div ref={containerRef} className="canvas-container">
      {children}
    </div>
  )
}

// src/components/canvas/BackgroundLayer.tsx
export function BackgroundLayer() {
  const { currentScene } = useEditorStore()
  return (
    <Layer>
      <BackgroundShape bg={currentScene.background} />
    </Layer>
  )
}

// src/components/canvas/ElementsLayer.tsx
export function ElementsLayer() {
  const { elements, animProps } = useCanvasElements()
  return (
    <Layer>
      {elements.map(el => (
        <CanvasElement key={el.id} element={el} animProps={animProps[el.id]} />
      ))}
    </Layer>
  )
}

// src/hooks/useCanvasLayout.ts
export function useCanvasLayout() {
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  
  // Layout calculation logic here
  
  return { scale, offsetX, offsetY }
}
```

---

### 4. Add Performance Optimization

#### Current Problem:
No memoization. Everything re-renders on every state change.

#### Solution:
```typescript
// Memoize expensive components
export const CanvasElement = React.memo(function CanvasElement({ element, animProps }: Props) {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.element === nextProps.element &&
    prevProps.animProps === nextProps.animProps
  )
})

// Memoize expensive calculations
const sortedElements = useMemo(() => {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex)
}, [elements])

// Debounce expensive operations
const debouncedUpdateElement = useMemo(
  () => debounce((id: string, props: Partial<EditorElement>) => {
    updateElement(id, props)
  }, 16),  // ~60fps
  []
)

// Virtualize long lists
import { useVirtualizer } from '@tanstack/react-virtual'

function TimelineElements() {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: elements.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TRACK_HEIGHT,
    overscan: 5
  })
  
  return (
    <div ref={parentRef} className="timeline-elements">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <ElementTrack
            key={virtualRow.key}
            element={elements[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

---

### 5. Move to IndexedDB for Large Projects

#### Current Problem:
Storing entire project in Zustand causes performance issues with large projects.

#### Solution:
```typescript
// src/db/projectDB.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface ProjectDB extends DBSchema {
  projects: {
    key: string
    value: Project
  }
  scenes: {
    key: string
    value: Scene
    indexes: { 'by-project': string }
  }
  elements: {
    key: string
    value: EditorElement
    indexes: { 'by-scene': string }
  }
}

let db: IDBPDatabase<ProjectDB>

export async function initDB() {
  db = await openDB<ProjectDB>('luffy-editor', 1, {
    upgrade(db) {
      db.createObjectStore('projects', { keyPath: 'id' })
      
      const sceneStore = db.createObjectStore('scenes', { keyPath: 'id' })
      sceneStore.createIndex('by-project', 'projectId')
      
      const elementStore = db.createObjectStore('elements', { keyPath: 'id' })
      elementStore.createIndex('by-scene', 'sceneId')
    }
  })
}

export async function saveProject(project: Project) {
  await db.put('projects', project)
  
  // Save scenes separately
  for (const scene of project.scenes) {
    await db.put('scenes', { ...scene, projectId: project.id })
    
    // Save elements separately
    for (const element of scene.elements) {
      await db.put('elements', { ...element, sceneId: scene.id })
    }
  }
}

export async function loadProject(id: string): Promise<Project> {
  const project = await db.get('projects', id)
  if (!project) throw new Error('Project not found')
  
  // Load scenes
  const scenes = await db.getAllFromIndex('scenes', 'by-project', id)
  
  // Load elements for each scene
  for (const scene of scenes) {
    scene.elements = await db.getAllFromIndex('elements', 'by-scene', scene.id)
  }
  
  project.scenes = scenes
  return project
}

// Only keep current scene in Zustand
interface EditorState {
  projectId: string | null
  currentScene: Scene | null  // Only current scene, not all scenes
  // ... rest of state
}
```

---

### 6. Add Web Workers for Heavy Processing

#### Current Problem:
Animation calculations and export processing block the main thread.

#### Solution:
```typescript
// src/workers/animation.worker.ts
import { getAnimatedProps } from '../engine/animator'
import type { EditorElement } from '../types/editor'

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data
  
  switch (type) {
    case 'CALCULATE_ANIMATIONS': {
      const { elements, localTime } = payload
      const results = elements.map((el: EditorElement) => ({
        id: el.id,
        props: getAnimatedProps(el, localTime)
      }))
      self.postMessage({ type: 'ANIMATIONS_CALCULATED', payload: results })
      break
    }
  }
}

// src/hooks/useAnimationWorker.ts
export function useAnimationWorker() {
  const workerRef = useRef<Worker>()
  
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/animation.worker.ts', import.meta.url),
      { type: 'module' }
    )
    
    return () => workerRef.current?.terminate()
  }, [])
  
  const calculateAnimations = useCallback((elements: EditorElement[], localTime: number) => {
    return new Promise((resolve) => {
      workerRef.current!.onmessage = (e) => {
        if (e.data.type === 'ANIMATIONS_CALCULATED') {
          resolve(e.data.payload)
        }
      }
      
      workerRef.current!.postMessage({
        type: 'CALCULATE_ANIMATIONS',
        payload: { elements, localTime }
      })
    })
  }, [])
  
  return { calculateAnimations }
}
```

---

### 7. Add Testing Infrastructure

#### Current Problem:
No tests. Hard to refactor with confidence.

#### Solution:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})

// src/test/setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// src/store/__tests__/editorStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../editorStore'
import { makeProject } from '../../utils/defaults'

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: null,
      currentSceneId: null,
      selectedIds: []
    })
  })
  
  it('should load project', () => {
    const project = makeProject('test', 'Test Project')
    useEditorStore.getState().loadProject(project)
    
    expect(useEditorStore.getState().project).toBe(project)
    expect(useEditorStore.getState().currentSceneId).toBe(project.scenes[0].id)
  })
  
  it('should add scene', () => {
    const project = makeProject('test', 'Test Project')
    useEditorStore.getState().loadProject(project)
    
    const initialSceneCount = project.scenes.length
    useEditorStore.getState().addScene()
    
    expect(useEditorStore.getState().project!.scenes.length).toBe(initialSceneCount + 1)
  })
  
  // More tests...
})

// src/components/__tests__/Timeline.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Timeline from '../Timeline'
import { useEditorStore } from '../../store/editorStore'
import { makeProject } from '../../utils/defaults'

describe('Timeline', () => {
  it('should render timeline controls', () => {
    const project = makeProject('test', 'Test Project')
    useEditorStore.getState().loadProject(project)
    
    render(<Timeline />)
    
    expect(screen.getByText('Timeline')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })
  
  it('should play/pause on button click', () => {
    const project = makeProject('test', 'Test Project')
    useEditorStore.getState().loadProject(project)
    
    render(<Timeline />)
    
    const playButton = screen.getByRole('button', { name: /play/i })
    fireEvent.click(playButton)
    
    expect(useEditorStore.getState().isPlaying).toBe(true)
  })
  
  // More tests...
})
```

---

### 8. Enable TypeScript Strict Mode

#### Current Problem:
Loose type checking allows bugs to slip through.

#### Solution:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Then fix all type errors:
```typescript
// Before:
function updateElement(id: string, props: any) {
  // ...
}

// After:
function updateElement(id: string, props: Partial<EditorElement>) {
  // ...
}

// Before:
const scene = project.scenes.find(s => s.id === id)
scene.name = 'New Name'  // Error: scene might be undefined

// After:
const scene = project.scenes.find(s => s.id === id)
if (scene) {
  scene.name = 'New Name'
}
```

---

### 9. Add Logging and Monitoring

#### Current Problem:
No visibility into errors or performance issues in production.

#### Solution:
```typescript
// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
  data?: any
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  
  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      data
    }
    
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
    
    // Console output
    const method = level === 'debug' ? 'log' : level
    console[method](`[${level.toUpperCase()}]`, message, data)
    
    // Send to monitoring service (optional)
    if (level === 'error') {
      this.sendToMonitoring(entry)
    }
  }
  
  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }
  
  info(message: string, data?: any) {
    this.log('info', message, data)
  }
  
  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }
  
  error(message: string, data?: any) {
    this.log('error', message, data)
  }
  
  getLogs() {
    return this.logs
  }
  
  clearLogs() {
    this.logs = []
  }
  
  private sendToMonitoring(entry: LogEntry) {
    // Send to Sentry, LogRocket, etc.
  }
}

export const logger = new Logger()

// Usage:
logger.info('Project loaded', { projectId: project.id })
logger.error('Failed to export', { error: e.message })
```

---

### 10. Add Configuration System

#### Current Problem:
Magic numbers and hardcoded values scattered throughout code.

#### Solution:
```typescript
// src/config/index.ts
export const config = {
  timeline: {
    defaultZoom: 1,
    minZoom: 0.1,
    maxZoom: 5,
    zoomStep: 0.2,
    pxPerSecBase: 60,
    rulerHeight: 24,
    sceneHeight: 32,
    trackHeight: 24,
    snapThreshold: 5,
    snapGridSize: 0.1
  },
  
  canvas: {
    defaultWidth: 1920,
    defaultHeight: 1080,
    minWidth: 640,
    maxWidth: 7680,
    minHeight: 360,
    maxHeight: 4320,
    padding: 32
  },
  
  animation: {
    defaultDuration: 0.6,
    minDuration: 0.1,
    maxDuration: 30,
    defaultEasing: 'easeOut' as const,
    defaultDelay: 0
  },
  
  export: {
    defaultFps: 30,
    defaultQuality: 0.92,
    defaultBitrate: 10_000_000,
    formats: ['webm', 'mp4'] as const
  },
  
  editor: {
    autoSaveDelay: 2500,
    maxUndoHistory: 100,
    maxProjects: 50
  }
}

// Usage:
const PX_PER_SEC = config.timeline.pxPerSecBase * timelineZoom
```

---

## 📊 Migration Plan

### Phase 1: Foundation (Week 1)
1. Add error boundaries
2. Enable TypeScript strict mode
3. Add logging system
4. Add configuration system

### Phase 2: Performance (Week 2)
5. Add React.memo to expensive components
6. Add useMemo/useCallback where needed
7. Implement virtualization for timeline
8. Move heavy calculations to Web Workers

### Phase 3: State Management (Week 3)
9. Implement command pattern for undo/redo
10. Move to IndexedDB for large projects
11. Optimize Zustand store structure

### Phase 4: Testing (Week 4)
12. Set up Vitest
13. Write unit tests for store
14. Write component tests
15. Add E2E tests with Playwright

### Phase 5: Code Quality (Week 5)
16. Split large components
17. Remove unused code
18. Add ESLint + Prettier
19. Add pre-commit hooks

---

## 🎯 Success Metrics

### Performance:
- Timeline renders in <50ms
- Canvas renders at 60fps
- Export processes at 2x realtime
- Memory usage <200MB for typical project

### Code Quality:
- Test coverage >80%
- Zero TypeScript errors
- Zero ESLint warnings
- All components <200 lines

### Developer Experience:
- Hot reload works reliably
- Build time <10 seconds
- Type checking <5 seconds
- Tests run in <30 seconds

---

## 📚 Recommended Libraries

### State Management:
- Zustand (current) - Good for small/medium state
- Jotai - Better for large state, atomic updates
- Valtio - Proxy-based, very performant

### Performance:
- @tanstack/react-virtual - Virtualization
- react-window - Alternative virtualization
- use-debounce - Debouncing hooks

### Testing:
- Vitest - Fast, modern test runner
- @testing-library/react - Component testing
- Playwright - E2E testing
- MSW - API mocking

### Code Quality:
- ESLint - Linting
- Prettier - Formatting
- Husky - Git hooks
- lint-staged - Pre-commit linting

---

This architecture overhaul will make your codebase more maintainable, performant, and testable. Implement changes incrementally to avoid breaking existing functionality.
