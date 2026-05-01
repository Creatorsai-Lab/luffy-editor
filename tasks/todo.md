# Luffy Editor — Task List

## Phase 1 · Foundation

- [ ] **Task 1** — Project scaffold: electron-vite + React + TS + Tailwind + all deps (`npm run dev` opens window)
- [ ] **Task 2** — App shell layout: Header / TopBar / MenuBar / LeftSidebar / Canvas area / Timeline skeleton
- [ ] **Task 3** — Types + Zustand store: all EditorElement types, Scene, Project, Animation; full action surface

### ✅ Checkpoint A
- [ ] Window opens, layout renders, store initialises, `npm run build` clean

---

## Phase 2 · Canvas + Core Elements

- [ ] **Task 4** — Konva canvas stage: renders scene background, scales to viewport, handles empty state
- [ ] **Task 5** — Text elements: add/select/move/resize/edit inline; text properties panel in sidebar
- [ ] **Task 6** — Shape elements: rect / circle / triangle; fill, stroke, corner radius in sidebar
- [ ] **Task 7** — Arrow / line elements: click-drag to draw; arrowhead style; stroke in sidebar
- [ ] **Task 8** — Code block elements: Monaco modal → styled canvas block; language/theme in sidebar

### ✅ Checkpoint B
- [ ] All 4 element types work (add, select, style, delete); `npm run build` clean

---

## Phase 3 · Scene, Animation, Timeline, Playback

- [ ] **Task 9**  — Scene management: add/remove/reorder scenes; duration; transition type
- [ ] **Task 10** — Animation engine + panel: `getAnimatedProps(el, t)` for fade/slide/scale/typewriter; assign via sidebar
- [ ] **Task 11** — Timeline UI: time ruler, scene blocks, element animation tracks, draggable playhead
- [ ] **Task 12** — Playback engine: rAF loop, animated canvas, scene transitions

### ✅ Checkpoint C
- [ ] Multi-scene video plays with animations; timeline scrubs correctly; `npm run build` clean

---

## Phase 4 · Background, Preview, Export

- [ ] **Task 13** — Background system: solid / gradient / grid / dots per-scene via TopBar
- [ ] **Task 14** — Preview modal: full-screen animated playback with play/pause and progress
- [ ] **Task 15** — Export engine: FFmpeg.wasm frame-by-frame MP4, progress modal, save dialog

### ✅ Checkpoint D
- [ ] 10s test video exports to MP4; plays in system player; `npm run build` clean

---

## Phase 5 · Polish

- [ ] **Task 16** — Layer system: z-order list in sidebar, bring forward/send back, lock, visibility
- [ ] **Task 17** — CLAUDE.md + README update: dev commands, architecture, quickstart

### ✅ Final Checkpoint
- [ ] Full workflow end-to-end; `npm run package` produces Windows installer; zero TypeScript errors
