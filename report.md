# Luffy Editor — Full Codebase Audit & Export Fix Guide

> **Date**: May 2026 | **Scope**: Full codebase at `d:\luffy-editor`  
> **Focus**: Video export bugs, architecture flaws, and improvement roadmap

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [🔴 CRITICAL: Video Export Bugs (Your Current Issue)](#critical-video-export-bugs)
4. [🟠 High-Priority Flaws](#high-priority-flaws)
5. [🟡 Medium-Priority Issues](#medium-priority-issues)
6. [🟢 What's Already Good](#whats-already-good)
7. [Security & Reliability](#security--reliability)
8. [Improvement Roadmap](#improvement-roadmap)

---

## Executive Summary

Luffy Editor has a solid foundation — React + Konva + Zustand with clean type definitions and a sensible scene/element/animation model. However, **video export is broken** due to several interacting bugs:

1. **`window.api.fs` is not declared in the TypeScript global types** — the "Save File" button calls a method the type system doesn't know about, and more critically, the browser fallback stub in `main.tsx` doesn't include it either.
2. **The save dialog only offers MP4 filter** even when exporting WebM — the saved file will have the wrong extension or fail to save.
3. **Export rendering is non-deterministic** — it depends on `requestAnimationFrame` timing, `setTimeout` delays, and React state propagation, causing blank/corrupted frames.
4. **FFmpeg.wasm loads from a CDN at runtime** — if the network is slow or offline, export fails silently.
5. **Memory pressure** — FFmpeg.wasm virtual FS accumulates all JPEG frames before encoding begins.

---

## Architecture Overview

```
electron/
  main/index.ts          — Electron main process, IPC handlers, file I/O
  preload/index.ts       — Context bridge (window.api)

src/
  App.tsx                — Root component, project boot, auto-save
  main.tsx               — Entry point, browser fallback stubs
  
  types/
    editor.ts            — Domain model (Project, Scene, Element, Animation)
    global.d.ts          — window.api type declarations
  
  store/
    editorStore.ts       — Main Zustand store (project, playback, UI state)
    canvasStore.ts        — Canvas settings (grid, guides, zoom)
    historyStore.ts       — Undo/redo via JSON snapshots
  
  engine/
    animator.ts           — Animation evaluation (getAnimatedProps)
    exporter.ts           — MediaRecorder-based WebM export
    ffmpegExporter.ts     — FFmpeg.wasm-based MP4/WebM export
    transitionRenderer.ts — Scene transition compositing
    stageRegistry.ts      — Konva stage singleton (avoids Immer freezing)
  
  components/
    canvas/               — Konva stage, element renderers, toolbar
    layout/               — Header, sidebar, timeline, top bar
    modals/               — Code editor, preview, export dialogs
    panels/               — Property panels (text, shapes, animations, etc.)
    ui/                   — Shared UI components
```

---

## 🔴 CRITICAL: Video Export Bugs

These are the bugs directly causing your export failures.

### Bug 1: `window.api.fs.writeFile` is undeclared in types

**Files**: `src/types/global.d.ts`, `src/components/modals/ExportModal.tsx:145`

The ExportModal calls `window.api.fs.writeFile(path, buffer)` to save the exported blob. However:

- **`global.d.ts` does NOT declare `fs` on `window.api`** — TypeScript doesn't catch this, but the browser fallback in `main.tsx` also doesn't stub it.
- The preload script (`electron/preload/index.ts:26-28`) *does* expose `fs.writeFile`, and the main process (`electron/main/index.ts:164-166`) *does* handle `fs:write-file` — so it works in Electron but **crashes in dev/browser mode**.

**Fix**: Add `fs` to the type declaration in `global.d.ts`:

```diff
 declare global {
   interface Window {
     api: {
       // ... existing ...
+      fs: {
+        writeFile: (path: string, data: Uint8Array) => Promise<void>
+      }
     }
   }
 }
```

And add the stub in `main.tsx`:

```diff
 (window as unknown as { api: unknown }).api = {
   // ... existing stubs ...
+  fs: { writeFile: async () => { console.warn('fs.writeFile not available in browser') } },
 }
```

### Bug 2: Save dialog only offers `.mp4` filter

**File**: `electron/main/index.ts:153-159`

```typescript
ipcMain.handle('dialog:save-video', async (_, defaultName: string) => {
  const r = await dialog.showSaveDialog(win, {
    defaultPath: join(app.getPath('downloads'), defaultName),
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]  // ← HARDCODED!
  })
```

When the user exports WebM, the dialog still only shows MP4 as a filter. The file gets saved with `.mp4` extension but contains WebM data — most players will refuse to open it.

**Fix**: Pass the format from the renderer:

```typescript
ipcMain.handle('dialog:save-video', async (_, defaultName: string) => {
  const ext = defaultName.split('.').pop() ?? 'mp4'
  const filterName = ext === 'webm' ? 'WebM Video' : 'MP4 Video'
  const r = await dialog.showSaveDialog(win, {
    defaultPath: join(app.getPath('downloads'), defaultName),
    filters: [
      { name: filterName, extensions: [ext] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
```

### Bug 3: Export frame rendering is non-deterministic

**File**: `src/components/modals/ExportModal.tsx:73-98`

The `renderFrame` callback does this per frame:

```typescript
renderFrame: async (t) => {
  setPlayhead(t)                                    // React state update
  await new Promise(r => setTimeout(r, 0))          // Yield to event loop
  await new Promise(r => requestAnimationFrame(r))  // Wait for paint
  await new Promise(r => setTimeout(r, 30))         // Arbitrary 30ms wait
}
```

**Problems**:
- `setPlayhead` is a React state update — it triggers a re-render cycle, but Konva may not have drawn by the time the frame is captured.
- The 30ms wait is arbitrary. On a slow machine with complex scenes, Konva won't finish rendering in 30ms. On a fast machine, it wastes time.
- Scene switching (`setCurrentScene`) also triggers a React re-render, and there's no guarantee the new scene's elements are mounted before capture.

**Fix**: The export should use a **synchronous render pipeline** that doesn't depend on React's render cycle:

```typescript
// Ideal: renderFrame should directly call Konva's draw, not go through React state
renderFrame: async (t) => {
  // 1. Compute which scene we're in
  // 2. Directly set element positions/opacity via getAnimatedProps
  // 3. Call stage.batchDraw() synchronously
  // 4. Capture frame
}
```

As a quick fix, increase the wait and add a retry/validation:

```typescript
renderFrame: async (t) => {
  setPlayhead(t)
  await new Promise(r => setTimeout(r, 0))
  // Wait for TWO animation frames to ensure Konva has drawn
  await new Promise(r => requestAnimationFrame(r))
  await new Promise(r => requestAnimationFrame(r))
  // Force Konva redraw
  const stage = getStage()
  if (stage) stage.batchDraw()
  await new Promise(r => setTimeout(r, 50))
}
```

### Bug 4: FFmpeg.wasm loads from CDN at runtime

**File**: `src/engine/ffmpegExporter.ts:42-47`

```typescript
const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
await ffmpegInstance.load({
  coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
  wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
})
```

- **Offline = export broken**. No fallback, no user-visible error — it just hangs or crashes.
- `toBlobURL` downloads ~30MB over the network every time (it's cached in memory but not persisted).

**Fix (short-term)**: Bundle the FFmpeg core files in your app:

```typescript
// Copy @ffmpeg/core files to public/ and load locally
const baseURL = '/ffmpeg'  // served from public/ffmpeg/
```

**Fix (long-term)**: Use native FFmpeg binary via Electron's main process for real performance.

### Bug 5: `saveBlob` in exporter.ts is dead code

**File**: `src/engine/exporter.ts:82-90`

The `saveBlob` function creates an `<a>` tag download link — this is a browser-only approach that won't work correctly in Electron (it downloads to the default location without a save dialog). The ExportModal doesn't even use this function; it has its own save flow. This is confusing dead code.

---

## 🟠 High-Priority Flaws

### 1. `zIndex` ordering operations corrupt layer order

**File**: `src/store/editorStore.ts:261-303`

- `bringToFront(id)` sets `el.zIndex = sc.elements.length - 1` without adjusting other elements.
- `sendToBack(id)` sets `el.zIndex = 0` without adjusting other elements.
- After a few operations, multiple elements share the same `zIndex`, causing undefined render order.
- `removeElement` doesn't renormalize remaining elements' indices.

**Fix**: Add a normalization utility:

```typescript
function normalizeZIndices(elements: EditorElement[]) {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)
  sorted.forEach((el, i) => { el.zIndex = i })
}
```

Call it after every z-order mutation and element removal.

### 2. History system causes performance degradation

**File**: `src/store/editorStore.ts:446-470`, `src/store/historyStore.ts`

- Every project change triggers `JSON.stringify(project)` **twice** — once for comparison (`currentStr !== lastStr`) and once for the history snapshot.
- With large projects (many elements, embedded data), this becomes a severe bottleneck.
- Undo/redo sets `isDirty = true`, which triggers auto-save, which triggers another history entry — creating a feedback loop.

**Fix**:
- Use Immer patches instead of full JSON snapshots.
- Add an `isUndoRedoing` flag to prevent history capture during undo/redo.
- Debounce more aggressively or use a dirty counter instead of JSON comparison.

### 3. Timeline keyboard shortcut conflicts

**Files**: `src/components/canvas/EditorCanvas.tsx:109-121`, `src/components/layout/Timeline.tsx:159-166`

Both `EditorCanvas` and `Timeline` listen for `Delete`/`Backspace` globally:
- EditorCanvas: deletes selected elements
- Timeline: deletes the current scene

Both handlers fire on the same keypress! If you have an element selected AND you're on a scene, pressing Delete could delete both the element and the scene.

**Fix**: One handler should consume the event. Add priority logic:
```typescript
// In Timeline's handler:
if (e.key === 'Delete' || e.key === 'Backspace') {
  // Only delete scene if no elements are selected
  const { selectedIds } = useEditorStore.getState()
  if (selectedIds.length > 0) return  // Let EditorCanvas handle it
  // ... delete scene
}
```

### 4. Multiple element deletion triggers N state updates

**File**: `src/components/canvas/EditorCanvas.tsx:114-117`

```typescript
selectedIds.forEach(id => {
  removeElement(id)  // Each call triggers a separate Zustand mutation
})
```

**Fix**: Add a batch action `removeElements(ids: string[])` to the store.

### 5. WebM export doesn't handle multi-scene correctly

**File**: `src/engine/exporter.ts:51-66`

The `exportToWebM` function iterates frames using `renderFrame(t)` which sets the playhead, but it **doesn't switch scenes**. It relies on whoever calls `renderFrame` to also manage scene switching — but the ExportModal's WebM path (`lines 110-114`) only does `setPlayhead(t)` with a basic `setTimeout(16)`, never switching scenes.

**Fix**: The WebM `renderFrame` callback in ExportModal needs the same scene-switching logic as the FFmpeg path.

---

## 🟡 Medium-Priority Issues

### 1. Konva internals dependency

**Files**: `src/components/canvas/EditorCanvas.tsx:373`, `src/components/modals/PreviewModal.tsx:196`

Both access `(ctx as unknown as { _context: CanvasRenderingContext2D })._context` — this is an undocumented Konva internal. A Konva version bump could break background rendering silently.

### 2. Debug logging in hot paths

**File**: `src/components/canvas/EditorCanvas.tsx:64, 111-119`

`console.log` on every canvas resize and every delete key press will spam devtools and degrade performance during playback/export.

### 3. Preview transitions don't match export transitions

**File**: `src/components/modals/PreviewModal.tsx:65-101`

Preview uses CSS transforms for transitions (translateX, scale, opacity), while the export uses canvas compositing via `transitionRenderer.ts`. These produce visually different results — what you see in preview is NOT what you get in the export.

### 4. Animation icons incomplete in Timeline

**File**: `src/components/layout/Timeline.tsx:23-36`

`ANIM_ICONS` only defines icons for the original 12 animation types but the type system has 23 types (including `typewriterChars`, `typewriterWords`, `textFade`, `textBurst`, `textBounce`, `textBlock`, `textSquiz`, `textSpread`, `textTwirl`, `textZoomIn`, `textZoomOut`). These new text animations will show `undefined` in the timeline.

### 5. `AudioElement` is modeled but never rendered or exported

**Files**: `src/types/editor.ts:164-175`, `src/utils/defaults.ts:170-185`

Audio elements exist in the type system and have a factory function, but:
- No `AudioKonva` renderer exists.
- Neither exporter mixes audio.
- No UI panel to control audio.

### 6. Video element never plays during preview/export

**File**: `src/components/canvas/elements/VideoKonva.tsx`

The `VideoKonva` component creates a `<video>` element and shows one frame, but:
- It never calls `video.play()`.
- During export, the video frame is always the first frame (or whatever frame loaded).
- No synchronization with the timeline playhead.

### 7. `editorStore.getSceneAtTime` returns null for the last frame

**File**: `src/store/editorStore.ts:426-437`

```typescript
getSceneAtTime: (t) => {
  for (const scene of project.scenes) {
    if (t < elapsed + scene.duration) {  // strict < means t === totalDuration returns null
      return { scene, localTime: t - elapsed }
    }
    elapsed += scene.duration
  }
  return null  // ← Returns null at exactly the last frame
}
```

This causes the last frame of a project to potentially not render during export.

### 8. Canvas resize logging and "never upscale" limit

**File**: `src/components/canvas/EditorCanvas.tsx:58`

```typescript
const s = Math.min(cw / pw, ch / ph, 1)  // never upscale beyond 1:1
```

For a 4K project (3840×2160) on a 1920×1080 display, this is correct. But for a 1080×1920 vertical project, the canvas will be tiny because it can't scale up. Consider allowing upscaling with a configurable max (e.g., 2x).

---

## 🟢 What's Already Good

- **Clean type system**: `editor.ts` has well-defined discriminated unions for elements, backgrounds, transitions.
- **Separation of concerns**: Engine (animator, exporter, transitions) is separate from UI components.
- **Stage registry pattern**: Keeping Konva out of Zustand/Immer avoids object freezing bugs.
- **Rich animation system**: 23 animation types with easing, delays, and loop support.
- **Cross-Origin headers**: Electron main process correctly sets COEP/COOP headers for FFmpeg.wasm SharedArrayBuffer.
- **Browser fallback**: `main.tsx` provides stubs so the app can run outside Electron for development.
- **Auto-save with debouncing**: Prevents data loss without thrashing the disk.
- **Transition renderer**: Canvas-based compositing for 7 transition types (fade, slide, push, zoom, wipe, morph, none).

---

## Security & Reliability

| Issue | File | Risk |
|-------|------|------|
| Asset upload trusts arbitrary `sourcePath` from renderer | `electron/main/index.ts:125` | Medium — compromised renderer can exfiltrate files |
| `shell:open-path` accepts any path | `electron/main/index.ts:161` | Low — expected for desktop app |
| `fs:write-file` accepts any path | `electron/main/index.ts:164` | Medium — should restrict to project dirs |
| FFmpeg loaded from unpkg CDN | `ffmpegExporter.ts:42` | High — offline breaks, supply-chain risk |

**Recommendations**:
- Validate `sourcePath` in asset upload comes from a dialog result.
- Restrict `fs:write-file` to project directory or downloads folder.
- Bundle FFmpeg core files locally.

---

## Improvement Roadmap

### Phase 1: Fix Export (Immediate — 2-3 days)

1. **Add `fs` to `global.d.ts`** and `main.tsx` browser stub.
2. **Fix save dialog** to support both MP4 and WebM filters dynamically.
3. **Add scene switching** to the WebM export path.
4. **Increase frame render wait** and add `stage.batchDraw()` forcing in export.
5. **Bundle FFmpeg core locally** instead of loading from CDN.
6. **Fix `getSceneAtTime`** to handle `t === totalDuration`.

### Phase 2: Deterministic Render Pipeline (1-2 weeks)

1. Build a pure `renderFrame(project, t) → Canvas` function that doesn't depend on React state.
2. Make preview and export use the same renderer.
3. Implement proper video element playback synced to timeline.
4. Fix z-index normalization.

### Phase 3: Audio & Polish (2-3 weeks)

1. Implement audio rendering (at least background music + voiceover).
2. Add `AudioKonva` component (waveform visualization on canvas).
3. Audio mixing in FFmpeg export pipeline.
4. Batch element operations (multi-delete, multi-move).

### Phase 4: Education/Science Features

1. LaTeX/math rendering (KaTeX → raster, cached per expression).
2. Deterministic code highlighting (Shiki instead of Monaco for export).
3. Step-by-step reveal animations for educational content.
4. Diagram primitives (labeled arrows, callouts, highlight boxes).

---

## Quick Reference: Files to Fix for Working Export

| Priority | File | Issue |
|----------|------|-------|
| 🔴 P0 | `src/types/global.d.ts` | Add `fs.writeFile` declaration |
| 🔴 P0 | `src/main.tsx` | Add `fs` to browser fallback stub |
| 🔴 P0 | `electron/main/index.ts` | Fix save dialog filter for WebM |
| 🔴 P0 | `src/components/modals/ExportModal.tsx` | Fix frame rendering timing, add scene switching for WebM |
| 🟠 P1 | `src/engine/ffmpegExporter.ts` | Bundle FFmpeg locally, improve frame capture reliability |
| 🟠 P1 | `src/store/editorStore.ts` | Fix `getSceneAtTime` off-by-one |
| 🟡 P2 | `src/store/editorStore.ts` | Fix z-index operations |
| 🟡 P2 | `src/components/layout/Timeline.tsx` | Fix keyboard conflict, add missing animation icons |
