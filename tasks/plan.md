# Implementation Plan: Luffy Editor

## Overview

A desktop video creation and editing application optimised for technical/educational content (ML, AI, math, system design). Scene-based architecture: a video is a sequence of scenes; each scene holds elements (text, shapes, arrows, code blocks) with keyframe animations. The user edits on a Konva canvas, previews playback in real time, and exports to MP4 via FFmpeg.wasm.

## Architecture Decisions

| Decision | Rationale |
|---|---|
| **electron-vite** | Vite HMR + Electron in one tool; fastest dev loop |
| **React-Konva** | 2D canvas with first-class React integration; built-in Transformer for resize/rotate |
| **Zustand** | Minimal boilerplate for deep editor state; no Provider wrapping |
| **Tailwind CSS (dark)** | Utility classes keep component files lean; JIT purges unused CSS |
| **@ffmpeg/ffmpeg 0.12.x** | Browser-native WASM encoding; no native binary dependency |
| **@monaco-editor/react** | Code editing in a modal; Monaco loaded lazily to keep boot fast |
| **lucide-react** | Consistent, small icon set; tree-shakeable |
| **MediaRecorder fallback** | Used for quick preview recording; FFmpeg used for final HQ export |

## Dependency Graph

```
Task 1 — Project scaffold (electron-vite boots)
  └─ Task 2 — App shell layout (Header / TopBar / MenuBar / Sidebar / Canvas area / Timeline)
       └─ Task 3 — Types + Zustand store foundation
            ├─ Task 4 — Konva canvas stage (scene background, zoom, empty state)
            │    ├─ Task 5 — Text element (add, select, move, resize, edit, properties panel)
            │    ├─ Task 6 — Shape elements (rect/circle/triangle, style panel)
            │    ├─ Task 7 — Arrow elements (draw, arrowheads, style panel)
            │    └─ Task 8 — Code block element (Monaco modal → canvas render)
            ├─ Task 9 — Scene management (add/remove/reorder, transition type)
            ├─ Task 10 — Animation engine + panel (fade/slide/scale keyframes)
            │    └─ Task 11 — Timeline UI (scene blocks, element tracks, playhead)
            │         └─ Task 12 — Playback engine (rAF loop, animated element states)
            ├─ Task 13 — Background system (solid / gradient / grid / dots)
            ├─ Task 14 — Preview modal (full-screen animated playback)
            └─ Task 15 — Export engine (FFmpeg.wasm, frame-by-frame, progress bar)
                 └─ Task 16 — Layer system (z-order controls in sidebar)
                      └─ Task 17 — CLAUDE.md + README update
```

---

## Phase 1 — Foundation

### Task 1: Project Scaffold

**Description:** Initialise the electron-vite project with React, TypeScript, Tailwind CSS, and all required npm dependencies. The application window should open without errors.

**Acceptance criteria:**
- [ ] `npm run dev` opens an Electron window showing a blank React app
- [ ] Tailwind dark theme renders (dark background visible)
- [ ] TypeScript compiles with zero errors (`npm run build`)
- [ ] All peer-dependency warnings resolved

**Verification:**
- [ ] `npm run dev` — window appears, no console errors
- [ ] `npm run build` — exits 0

**Dependencies:** None

**Files:**
- `package.json`
- `electron.vite.config.ts`
- `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`
- `tailwind.config.js`, `postcss.config.js`
- `index.html`
- `electron/main/index.ts`
- `electron/preload/index.ts`
- `src/main.tsx`, `src/index.css`, `src/App.tsx`

**Estimated scope:** Large (10 config/setup files)

---

### Task 2: App Shell Layout

**Description:** Build the static layout skeleton — Header, TopBar, MenuBar, LeftSidebar, main canvas area, and Timeline strip — using Tailwind. No interactivity yet; just the correct regions, proportions, and dark theme.

**Acceptance criteria:**
- [ ] Six layout regions visible: Header / TopBar / MenuBar / LeftSidebar / Canvas area / Timeline
- [ ] Layout is responsive to window resize (flex/grid, no overflow)
- [ ] Font sizes ≤ 12px for labels, icons ≤ 16px, padding ≤ 8px (per spec)
- [ ] Dark theme consistent across all regions (#0f0f0f bg, #1a1a1a panels)

**Verification:**
- [ ] `npm run dev` — screenshot all six regions present
- [ ] Resize window to 1024×768 — no clipping or overflow

**Dependencies:** Task 1

**Files:**
- `src/App.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/layout/MenuBar.tsx`
- `src/components/layout/LeftSidebar.tsx`
- `src/components/layout/Timeline.tsx`

**Estimated scope:** Medium (6 components)

---

### Task 3: Types + Zustand Store Foundation

**Description:** Define all TypeScript types (Project, Scene, EditorElement subtypes, Animation, Background, Transition) and the Zustand store with the full action surface. No UI interaction yet — this is pure data layer.

**Acceptance criteria:**
- [ ] `EditorElement` union type covers: `text | shape | arrow | code | image`
- [ ] `Animation` type has: `type`, `startTime`, `duration`, `delay`, `easing`, `params`
- [ ] Store exposes actions: `addElement`, `updateElement`, `removeElement`, `addScene`, `removeScene`, `setCurrentScene`, `selectElement`, `setPlayhead`, `setActiveTool`
- [ ] Store initialises with one default scene and correct default project
- [ ] Zero TypeScript errors

**Verification:**
- [ ] `npm run build` — compiles clean
- [ ] Import store in App.tsx, log state — prints correct initial shape

**Dependencies:** Task 1

**Files:**
- `src/types/editor.ts`
- `src/store/editorStore.ts`

**Estimated scope:** Medium (2 files, ~300 lines combined)

---

### ✅ Checkpoint A — Foundation

- [ ] `npm run dev` opens without errors
- [ ] All six layout regions render
- [ ] Store initialises with one default scene
- [ ] `npm run build` exits 0

---

## Phase 2 — Canvas + Core Elements

### Task 4: Konva Canvas Stage

**Description:** Mount a Konva Stage inside the canvas area. The stage renders the current scene's background, scales to fit the viewport while preserving aspect ratio, and shows an empty canvas placeholder state.

**Acceptance criteria:**
- [ ] Stage renders at correct aspect ratio for selected canvas size (16:9 HD default)
- [ ] Scene background colour (solid white/dark) fills the stage
- [ ] Stage scales on window resize without distortion
- [ ] Clicking empty canvas deselects all elements

**Verification:**
- [ ] `npm run dev` — stage visible with white/dark background
- [ ] Resize window — stage rescales correctly

**Dependencies:** Task 3

**Files:**
- `src/components/canvas/EditorCanvas.tsx`

**Estimated scope:** Small (1 file)

---

### Task 5: Text Elements — Add, Edit, Style

**Description:** Full text element lifecycle: click "Text" in MenuBar → click canvas to place a text block → select/move/resize via Konva Transformer → double-click to edit inline → left sidebar shows font family, size, weight, color, alignment controls that update the element in real time.

**Acceptance criteria:**
- [ ] Clicking "Text" in MenuBar sets `activeTool = 'text'`
- [ ] Clicking canvas places a `TextElement` at that position
- [ ] Konva Transformer appears on selection: resize/rotate works
- [ ] Double-click enters edit mode (Konva text editing)
- [ ] Sidebar shows: font family dropdown (≥ 5 fonts), size, bold/italic, colour, align
- [ ] Changes in sidebar reflect immediately on canvas

**Verification:**
- [ ] Add text, move it, resize it — position/size persists in store
- [ ] Change font to "Monospace" in sidebar — canvas updates
- [ ] Delete key removes selected text element

**Dependencies:** Task 4

**Files:**
- `src/components/canvas/EditorCanvas.tsx` (extend)
- `src/components/canvas/elements/TextKonva.tsx`
- `src/components/panels/TextPanel.tsx`
- `src/components/layout/LeftSidebar.tsx` (wire panel)

**Estimated scope:** Medium (4 files)

---

### Task 6: Shape Elements — Add, Edit, Style

**Description:** Shapes (rectangle, circle, triangle) can be added via MenuBar, placed on canvas, selected/resized, and styled (fill colour, stroke colour, stroke width, corner radius for rect) via the left sidebar.

**Acceptance criteria:**
- [ ] Three shape types available in MenuBar (rect / circle / triangle)
- [ ] Shape placed at click position with default 120×80 size
- [ ] Sidebar shows fill picker, stroke picker, stroke width slider
- [ ] Rect shows corner radius slider
- [ ] Delete key removes selected shape

**Verification:**
- [ ] Place all three shapes — each renders correctly
- [ ] Change fill to red — canvas updates immediately

**Dependencies:** Task 4

**Files:**
- `src/components/canvas/elements/ShapeKonva.tsx`
- `src/components/panels/ShapePanel.tsx`
- `src/components/layout/LeftSidebar.tsx` (extend)

**Estimated scope:** Small–Medium (3 files)

---

### Task 7: Arrow / Line Elements

**Description:** Draw arrows and lines on the canvas. Click-drag to define start and end points. Style (stroke colour, width, arrowhead style) via sidebar. Supports: no-head line, one-head arrow, double-head arrow.

**Acceptance criteria:**
- [ ] Click "Arrow" in MenuBar, then click-drag on canvas to draw
- [ ] Arrow renders with correct arrowhead at end point
- [ ] Three arrowhead modes: none / end / both
- [ ] Sidebar shows stroke colour, width, arrowhead selector
- [ ] Arrow can be selected and endpoints dragged to reposition

**Verification:**
- [ ] Draw an arrow, change colour to blue — updates on canvas
- [ ] Switch arrowhead to "both" — heads appear on both ends

**Dependencies:** Task 4

**Files:**
- `src/components/canvas/elements/ArrowKonva.tsx`
- `src/components/panels/ArrowPanel.tsx`
- `src/components/layout/LeftSidebar.tsx` (extend)

**Estimated scope:** Small–Medium (3 files)

---

### Task 8: Code Block Elements

**Description:** Code blocks display syntax-highlighted code on the canvas. Clicking "Code" in MenuBar opens a Monaco Editor modal. On save, a styled code block (dark background, monospace font, line numbers) renders on the canvas. Double-clicking the element re-opens the modal.

**Acceptance criteria:**
- [ ] Monaco modal opens with language selector (JS, TS, Python, Bash, etc.)
- [ ] Save closes modal and places/updates code block on canvas
- [ ] Code block renders with correct syntax colouring and background
- [ ] Sidebar shows language, font size, theme (dark/light)
- [ ] Double-click on placed code block reopens the modal

**Verification:**
- [ ] Paste a Python snippet → save → renders on canvas with Python highlighting
- [ ] Change language to TypeScript in sidebar — re-renders with TS colouring

**Dependencies:** Task 4

**Files:**
- `src/components/canvas/elements/CodeKonva.tsx`
- `src/components/modals/CodeEditorModal.tsx`
- `src/components/panels/CodePanel.tsx`
- `src/components/layout/LeftSidebar.tsx` (extend)

**Estimated scope:** Medium (4 files)

---

### ✅ Checkpoint B — All Core Elements

- [ ] All four element types (text, shape, arrow, code) can be added
- [ ] Each can be selected, moved, resized, deleted
- [ ] Each has a working properties panel in the sidebar
- [ ] `npm run build` exits 0

---

## Phase 3 — Scene, Animation, Timeline, Playback

### Task 9: Scene Management

**Description:** Users can add, remove, duplicate, and reorder scenes. The scene panel (bottom of timeline or sidebar) shows scene thumbnails. Each scene has a configurable duration (seconds). Selecting a scene loads it on the canvas.

**Acceptance criteria:**
- [ ] "Add Scene" button creates a new blank scene
- [ ] Clicking a scene thumbnail loads it on canvas
- [ ] Scene duration is editable (number input, default 5s)
- [ ] Delete scene removes it (minimum 1 scene enforced)
- [ ] Scene order can be changed via drag or arrow buttons
- [ ] Scene transition type selectable: none / fade / slide

**Verification:**
- [ ] Create 3 scenes, add different elements to each — switching loads correct elements
- [ ] Total duration = sum of scene durations (visible in TopBar)

**Dependencies:** Task 3, Task 4

**Files:**
- `src/components/layout/Timeline.tsx` (scene strip)
- `src/components/panels/TransitionPanel.tsx`
- `src/store/editorStore.ts` (extend with scene actions)

**Estimated scope:** Medium (3 files)

---

### Task 10: Animation Engine + Properties Panel

**Description:** Implement the animation interpolation engine and the animation assignment UI. Users can assign animations (fade in/out, slide in/out, scale in/out, typewriter for text) to any element, with configurable start time, duration, delay, and easing. The engine computes element visual state at any time T.

**Acceptance criteria:**
- [ ] `getAnimatedProps(element, localTime)` returns correct interpolated props for all animation types
- [ ] Supported animations: `fadeIn`, `fadeOut`, `slideIn` (4 directions), `slideOut`, `scaleIn`, `scaleOut`, `typewriter` (text only)
- [ ] Before animation start: entrance animations hide the element; exit animations keep it visible
- [ ] After animation end: element stays at final animated state
- [ ] Animation panel in sidebar: add animation, set type/start/duration/delay/easing
- [ ] Multiple animations per element supported

**Verification:**
- [ ] Assign `fadeIn` at t=1s, duration=1s to a text element — engine returns opacity 0 at t=0.5, 0.5 at t=1.5, 1.0 at t=2
- [ ] Assign `slideIn` from left — engine returns correct x offset at mid-animation

**Dependencies:** Task 3

**Files:**
- `src/engine/animator.ts`
- `src/components/panels/AnimationPanel.tsx`
- `src/components/layout/LeftSidebar.tsx` (add Animation tab)

**Estimated scope:** Medium (3 files, animation engine is the critical path)

---

### Task 11: Timeline UI

**Description:** The timeline strip at the bottom shows: a time ruler, scene blocks (coloured bars proportional to duration), element animation tracks within the current scene (one row per element), and a draggable playhead. Clicking on a scene block selects it.

**Acceptance criteria:**
- [ ] Time ruler shows second markers scaled to timeline width
- [ ] Scene blocks rendered in proportion to their duration
- [ ] Within the selected scene: one row per element showing animation bars (coloured for each animation)
- [ ] Playhead is a vertical line that can be dragged to scrub time
- [ ] Clicking a scene block in the strip loads that scene on canvas
- [ ] Timeline scrolls horizontally for long videos

**Verification:**
- [ ] Two scenes of 3s and 5s — scene blocks are 37.5% and 62.5% of timeline width
- [ ] Drag playhead to 2s — `store.playhead === 2`

**Dependencies:** Task 9, Task 10

**Files:**
- `src/components/layout/Timeline.tsx` (full implementation)

**Estimated scope:** Medium (1 complex file)

---

### Task 12: Playback Engine

**Description:** Play/pause button in TopBar drives a `requestAnimationFrame` loop that advances `playhead` through all scenes in order. Canvas renders animated element states computed by the animation engine. At scene end, transitions to next scene. Stops at total duration end.

**Acceptance criteria:**
- [ ] Play button starts rAF loop; pause stops it
- [ ] Playhead advances at wall-clock speed (1 second per second)
- [ ] Canvas shows animated element states (opacity, position, scale) computed from animation engine
- [ ] Scene transitions: `fade` cross-fades scenes; `none` cuts immediately
- [ ] Playback wraps back to start when it reaches the end
- [ ] Playhead in timeline UI tracks playback position

**Verification:**
- [ ] Element with `fadeIn` at t=1s: invisible at t=0, fades in at t=1–2s
- [ ] Two scenes: after scene 1 ends, scene 2 elements appear

**Dependencies:** Task 10, Task 11

**Files:**
- `src/components/canvas/EditorCanvas.tsx` (extend with playback mode)
- `src/store/editorStore.ts` (extend: isPlaying, playback loop)

**Estimated scope:** Small–Medium (2 files, careful rAF wiring)

---

### ✅ Checkpoint C — Scene, Animation, Playback

- [ ] Multi-scene video with different elements per scene
- [ ] Animations play back correctly in real time
- [ ] Timeline scrubbing updates canvas
- [ ] `npm run build` exits 0

---

## Phase 4 — Background, Preview, Export

### Task 13: Background System

**Description:** The TopBar "Background" picker lets users set per-scene backgrounds: solid colour, gradient (two-colour with angle), grid pattern, dot pattern, or an animated gradient. The canvas stage renders these correctly.

**Acceptance criteria:**
- [ ] Four background types: solid / gradient / grid / dots
- [ ] Solid: any colour via colour picker
- [ ] Gradient: two colour pickers + angle slider, linear gradient rendered
- [ ] Grid: adjustable grid colour and cell size
- [ ] Dots: adjustable dot colour and spacing
- [ ] Background is per-scene (different scenes can have different backgrounds)

**Verification:**
- [ ] Set scene 1 to gradient, scene 2 to grid — switching scenes shows correct backgrounds
- [ ] Gradient at 45° renders diagonal

**Dependencies:** Task 4, Task 9

**Files:**
- `src/components/canvas/EditorCanvas.tsx` (background rendering layer)
- `src/components/panels/BackgroundPanel.tsx`
- `src/components/layout/TopBar.tsx` (background picker trigger)

**Estimated scope:** Small–Medium (3 files)

---

### Task 14: Preview Modal

**Description:** A full-screen modal plays the complete video from the beginning. It uses the same playback engine (rAF + animation engine) but renders on a dedicated Konva stage inside the modal. Includes play/pause and a progress bar.

**Acceptance criteria:**
- [ ] "Preview" button in TopBar opens the modal
- [ ] Video auto-plays from t=0 on open
- [ ] Play/pause and progress bar present
- [ ] Close button dismisses and resets playback
- [ ] All animations and scene transitions play correctly

**Verification:**
- [ ] Open preview — video plays through all scenes with animations
- [ ] Pause at 3s — canvas frozen at t=3

**Dependencies:** Task 12

**Files:**
- `src/components/modals/PreviewModal.tsx`

**Estimated scope:** Small (1 file, reuses playback engine)

---

### Task 15: Export Engine (MP4)

**Description:** Frame-by-frame video export using FFmpeg.wasm. For each frame: set playhead, render Konva stage to canvas, capture as JPEG, pass to FFmpeg. Encodes to MP4 at the project FPS (default 30). Shows a progress bar in a modal during export.

**Acceptance criteria:**
- [ ] "Download" button in TopBar triggers export
- [ ] Export modal shows progress (% frames encoded)
- [ ] FFmpeg.wasm loads with SharedArrayBuffer (Electron headers set in main process)
- [ ] Output file saved to user's Downloads folder via Electron `dialog.showSaveDialog`
- [ ] MP4 plays correctly in system video player
- [ ] Export does not block the UI thread (runs in a Web Worker or async chunks)

**Verification:**
- [ ] Export a 3-scene, 10-second video at 30fps — MP4 file produced
- [ ] Open in VLC — animations visible, scene transitions present

**Dependencies:** Task 12, Task 14

**Files:**
- `src/engine/exporter.ts`
- `src/components/modals/ExportModal.tsx`
- `electron/main/index.ts` (extend: SharedArrayBuffer headers, save dialog IPC)
- `electron/preload/index.ts` (extend: IPC bridge for save dialog)

**Estimated scope:** Large (4 files; FFmpeg wiring is complex)

---

### ✅ Checkpoint D — Export Works

- [ ] 10-second test video exports to MP4
- [ ] MP4 plays back with correct animations
- [ ] No Electron/FFmpeg WASM errors in console
- [ ] `npm run build` exits 0

---

## Phase 5 — Polish

### Task 16: Layer System + Z-Order Controls

**Description:** Every element has a `zIndex`. The sidebar's "Layers" tab lists all elements in the current scene in z-order. Users can drag to reorder, or use "Bring Forward / Send Back" buttons. Lock and visibility toggles per layer.

**Acceptance criteria:**
- [ ] Layer list in sidebar shows element names in z-order (top = front)
- [ ] "Bring Forward" / "Send Back" buttons adjust zIndex
- [ ] Dragging a layer row reorders elements
- [ ] Lock toggle prevents selecting/moving the element on canvas
- [ ] Visibility toggle hides/shows element without deleting

**Verification:**
- [ ] Two overlapping shapes — send one back — it renders behind
- [ ] Lock a text element — clicking it on canvas does not select it

**Dependencies:** Task 5–8

**Files:**
- `src/components/panels/LayersPanel.tsx`
- `src/components/layout/LeftSidebar.tsx` (add Layers tab)
- `src/store/editorStore.ts` (zIndex actions)

**Estimated scope:** Medium (3 files)

---

### Task 17: CLAUDE.md + README Update

**Description:** Update `CLAUDE.md` with all dev commands, architecture overview, and component map. Update `README.md` with project description, quickstart, and build instructions.

**Acceptance criteria:**
- [ ] `CLAUDE.md` documents: `npm run dev`, `npm run build`, `npm run package`
- [ ] Architecture section covers: types, store, canvas, engine, panels
- [ ] `README.md` has: project description, screenshot placeholder, quickstart

**Dependencies:** All previous tasks

**Files:**
- `CLAUDE.md`
- `README.md`

**Estimated scope:** XS

---

### ✅ Final Checkpoint

- [ ] All 16 implementation tasks complete
- [ ] Full video creation workflow works end-to-end
- [ ] `npm run build` exits 0
- [ ] `npm run package` produces an NSIS installer (Windows)
- [ ] No TypeScript errors, no console errors in production build

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| FFmpeg.wasm SharedArrayBuffer in Electron | High — blocks export | Set COOP/COEP headers in main process; test early in Task 15 |
| Konva performance with many elements (>50) | Med — UI lag | Use `shouldComponentUpdate` / `listening={false}` for static elements |
| Monaco Editor bundle size (+5 MB) | Low — slow boot | Lazy-load Monaco only when code modal opens |
| `react-konva` + Transformer z-index confusion | Med — selection bugs | Keep Transformer on a separate top Layer |
| rAF playback drift across scenes | Med — animation desync | Use absolute wall-clock timestamps, not frame deltas |

## Open Questions

1. **Image/video upload**: Not scoped in Phase 1–5. Should uploaded images be stored as base64 in the project JSON or as referenced file paths?
2. **Project save/load**: Auto-save to JSON on disk? Explicit save button? Where is the default save location?
3. **Table element**: Mentioned in spec but not deeply described. Defer to a later phase?
4. **Math support**: Mentioned (LaTeX/KaTeX). Scope for v1 or later?
5. **Animated background**: The "animated gradient" background type — is CSS animation acceptable or must it render correctly in the exported video?
