# Luffy Editor — Codebase Review (May 2026)

This report is based on reading the current repository at `d:\luffy-editor`, focusing on editor state, canvas rendering (Konva), timeline/playback, and export (MediaRecorder + FFmpeg.wasm), plus Electron IPC for projects/assets.

## Executive summary

You have a solid “PowerPoint-like scenes + elements + animations” foundation (React + Konva + Zustand). The biggest gaps are **deterministic rendering/export**, **audio pipeline**, **scene transitions integration**, and **state/history correctness & performance**. Export in particular will currently be **slow, memory-heavy, and not truly deterministic**, and one export function is **misnamed** (it claims MP4 but returns WebM).

If your goal is “high-quality video exports” for educational/scientific content, the next milestone should be a **deterministic render graph** (scene → frame → encoder) with **explicit time stepping**, **transition composition**, and **audio mixing** (even if minimal initially).

## Status update (applied fixes)

The following items from the “Critical flaws” section have been **fixed in code**:

- **MediaRecorder export naming/behavior**: `src/engine/exporter.ts` now exposes `exportToWebM()` (truthful name). The old `exportToMP4()` remains only as a **deprecated back-compat wrapper** that returns WebM and logs a warning.
- **Avoid base64 frame capture**: MediaRecorder path switched from `stage.toDataURL() → Image decode` to `stage.toCanvas()` for lower overhead.
- **FFmpeg exporter JS OOM issue**: `src/engine/ffmpegExporter.ts` no longer buffers `frames: Uint8Array[]` in JS memory. Frames are written **per-frame** to the FFmpeg virtual FS as `frame%06d.jpg`.
- **Transition rule + export compositing**: Transition ownership is now consistent: **`scene.transition` is “from scene → next scene”** (exporter no longer reads `nextScene.transition.duration`). FFmpeg export now composites transition frames using `renderTransition()` by rendering both scenes during the transition window.

Notes:
- FFmpeg.wasm still stores encoded inputs in its virtual FS until encoding finishes (so long exports can still be memory-heavy), but the major “double buffering in JS + FFmpeg FS” problem is removed.

## What’s good already

- **Clear domain model** in `src/types/editor.ts`: `Project → scenes → elements`, animations attached to elements, plus backgrounds and transitions.
- **Good separation of concerns**:
  - Editor UI + Konva canvas in `src/components/canvas/EditorCanvas.tsx`
  - Animation evaluation in `src/engine/animator.ts`
  - Transition rendering utility in `src/engine/transitionRenderer.ts`
  - Electron IPC for persistence/assets in `electron/main/index.ts` and `electron/preload/index.ts`
- **Stage registry** (`src/engine/stageRegistry.ts`) correctly avoids putting Konva instances into Zustand/Immer (freezing issues).

## Critical flaws (correctness / “will bite you”)

### 1) `exportToMP4` doesn’t export MP4 (and isn’t deterministic)
File: `src/engine/exporter.ts`

- **Resolved**: MediaRecorder export is now exposed as `exportToWebM()`. `exportToMP4()` remains only as a deprecated wrapper for compatibility.
- **Not deterministic**: it relies on:
  - `requestAnimationFrame`
  - `setTimeout(msPerFrame)`
  - `MediaRecorder`’s internal scheduling
  This makes frame timing depend on the machine load and browser scheduling. For “scientific/educational” visuals, this will cause subtle drift and inconsistent animation timing.
- **Very slow frame path**: `stage.toDataURL()` → `new Image()` decode → `drawImage()` every frame. That’s expensive and can dominate runtime.

**Fix**
- ✅ Implemented as `exportToWebM()` and replaced base64 capture with `stage.toCanvas()`.
- For deterministic export, do **explicit frame stepping** with a fixed \(t = frameIndex / fps\) and render to a target canvas in one pass per frame (no sleeps).
- Prefer `stage.toCanvas()` (Konva supports exporting to a canvas) to avoid base64 + decode overhead.

### 2) `ffmpegExporter.ts` is extremely memory-heavy and will OOM on real projects
File: `src/engine/ffmpegExporter.ts`

- **Resolved (major part)**: exporter no longer keeps `frames[]` in JS memory. Frames are written per-frame to FFmpeg FS.
- It includes multiple “waits” per frame. This still makes export **slow** and not perfectly deterministic (because rendering is driven by UI state + async waits).
- **Resolved**: transition periods are now applied by compositing frames with `renderTransition()` when `renderSceneFrame(sceneId, globalTime)` is provided.
- It loads FFmpeg core from `unpkg.com`. That’s a reliability and supply-chain risk (offline export breaks; CDN changes can break you).

**Fix**
- ✅ Wrote frames per-frame and removed JS-side `frames[]`.
- ✅ Integrated transitions by rendering **two scene canvases** and composing with `renderTransition()`.
- Still recommended: use **native FFmpeg** in Electron for true streaming + long exports.
- Bundle FFmpeg assets locally (or pin and ship them) rather than fetching from the public internet at runtime.

### 3) Scene transitions data model is confusing (and likely wrong in export)
Files:
- `src/types/editor.ts` (transition lives on each `Scene` as `scene.transition`)
- `src/engine/ffmpegExporter.ts` (reads `nextScene?.transition.duration`)

In your model, a scene has a `transition` object. In the exporter, you treat the transition duration as belonging to the **next** scene (`nextScene?.transition.duration`). That’s ambiguous and will lead to off-by-one scene transition behavior.

**Fix**
- Pick one rule and encode it everywhere:
  - **Rule A (recommended)**: `scene.transition` describes the transition **from this scene → next scene**.
  - Then transition duration is `currentScene.transition.duration`, not `nextScene.transition.duration`.
- ✅ Implemented in exporter: transition duration is taken from the current (“from”) scene and transition frames are composited during export.

### 4) `zIndex` ordering operations are incorrect and can corrupt layering
File: `src/store/editorStore.ts`

- `bringToFront` and `sendToBack` only set the selected element’s `zIndex` to `len - 1` or `0`, but **do not renormalize the other elements**. Over time you’ll get multiple elements with the same `zIndex`, gaps, and inconsistent ordering depending on sort stability.
- `removeElement` doesn’t renormalize remaining elements.
- `bringForward`/`sendBackward` assumes a dense contiguous `zIndex` layout that your other operations don’t maintain.

**Fix**
- Store ordering as an array order (recommended) and compute `zIndex = index` when needed, or…
- Add a single `normalizeZIndices(scene)` utility and call it after any reorder/remove/bring-to-front/back operation.

### 5) History system is expensive and duplicates work
Files:
- `src/store/historyStore.ts`
- `src/store/editorStore.ts` (subscription at bottom)

- History snapshots are deep-cloned via `JSON.stringify/parse`, and the editor store subscription also JSON-stringifies the entire project (`currentStr` / `lastStr`) every time the project changes.
- This will become a major performance bottleneck as projects grow (images, code blocks, charts, many elements).
- It also marks the project dirty on undo/redo in a way that can spam autosave/history loops.

**Fix**
- Use structural sharing (Immer patches) or store a compact diff format:
  - Record actions (command pattern) or Immer patches rather than whole-project snapshots.
- If you keep snapshots, use a **fast hash** of the small parts that changed, not `JSON.stringify(project)` repeatedly.
- Tie undo/redo into the same mutation pipeline and disable history capture while applying undo/redo.

### 6) Debug logging left in hot paths
File: `src/components/canvas/EditorCanvas.tsx`

- Frequent `console.log()` calls (canvas resize logs, delete logs) will degrade performance and spam devtools, especially during playback/export.

**Fix**
- Gate logs behind a `DEBUG` flag or remove them.

## High-priority improvements (next 1–2 weeks)

### 1) Build a deterministic render pipeline (the “render graph”)
Target outcome: given a project and a timestamp \(t\), you can render **the exact same frame** every time.

**Suggested architecture**
- `evaluateProjectAtTime(project, t) -> { sceneId, localTime, transition? }`
- `renderSceneToCanvas(scene, localTime, canvasCtx)` (pure, deterministic)
- `renderFrame(project, t) -> ImageBitmap | Uint8Array` (composite with transitions)

Then:
- Preview playback: uses RAF to advance `t` but renders via the same `renderFrame`.
- Export: uses `for frameIndex in 0..N-1 => t=frameIndex/fps` and renders frames with no sleeps.

### 2) Integrate transitions into preview and export
Right now transitions exist in types and a renderer exists, but they aren’t actually applied in export (and preview appears scene-switched by time).

**Plan**
- During the last `transitionDuration` seconds of a scene, render both:
  - `fromScene` at its local time
  - `toScene` at its local time
- Compose via `renderTransition({ fromCanvas, toCanvas, progress, type, direction })`.

### 3) Fix export strategy for Electron (quality + speed)
For a desktop editor, the highest ROI is using native encoding.

**Recommended**
- Bundle FFmpeg (or ship a known ffmpeg binary per platform).
- Export frames to a temp folder as JPEG/PNG (or pipe raw frames), run ffmpeg with:
  - H.264 (`libx264`) MP4 for compatibility
  - Optional ProRes or lossless for “master exports”
- Add `-movflags +faststart` for MP4 streaming friendliness.

If you want to stay browser-only, consider **WebCodecs** for deterministic encoding (but Electron support and codec availability must be checked).

### 4) Audio pipeline is currently modeled but not rendered/encoded
Files:
- `src/types/editor.ts` includes `AudioElement`
- Exporters do not mix audio

**Fix**
- Define a simple audio model first:
  - project-level tracks: background music + voiceover
  - each audio element has `startAt` on the global timeline, trim, fade, volume
- In export:
  - Use ffmpeg `-filter_complex` to mix multiple audio inputs
  - Or pre-render an audio track and mux with the video output

## Medium-priority issues (stability / UX)

### 1) Timeline playback updates state in a risky way
File: `src/components/layout/Timeline.tsx`

- It uses `useEditorStore.setState` inside RAF and mutates `currentSceneId` based on time. This can cause surprising scene changes while scrubbing or editing.
- Keyboard frame step uses hard-coded `1/30` even if `project.fps` changes.

**Fix**
- Use `project.fps` everywhere.
- When the user is editing a specific scene, consider a mode where playback is constrained to the current scene vs whole-project timeline.

### 2) Element deletion loops cause multiple state updates
File: `src/components/canvas/EditorCanvas.tsx`

- Deleting `selectedIds.forEach(removeElement)` triggers multiple store updates; on large selections it’s slow and can cause intermediate inconsistent selection state.

**Fix**
- Add a `removeElements(ids: string[])` store action that performs one mutation and normalizes `zIndex` afterwards.

### 3) Background renderer relies on Konva private internals
File: `src/components/canvas/EditorCanvas.tsx` (`BackgroundShape`)

- Accessing `(ctx as any)._context` is relying on Konva internals. A Konva update could break this.

**Fix**
- Prefer supported Konva drawing APIs if possible, or isolate this in a small adapter with a fallback path.

## Security / reliability notes (Electron IPC)

File: `electron/main/index.ts`

- **Asset upload** trusts a `sourcePath` coming from renderer IPC. If renderer is compromised, it can request copying arbitrary files readable by the user into the project folder.
- `shell:open-path` and `fs:write-file` are powerful. They’re fine in a trusted app, but minimize attack surface.
- Runtime-loading FFmpeg from the internet (in `ffmpegExporter.ts`) is a reliability and supply-chain concern.

**Hardening suggestions**
- Validate IPC inputs (projectId exists; sourcePath must come from a dialog result, not arbitrary strings).
- Consider restricting `fs:write-file` to the project directory only.
- Ship dependencies locally (FFmpeg core/binaries).

## Code quality / maintainability improvements

- **Naming**: rename misnamed functions (`exportToMP4` returning WebM).
- **Normalization utilities**: add central utilities:
  - `getSceneStarts(project)` / `getSceneAtTime(project, t)`
  - `normalizeZIndices(scene)`
  - `clampDuration`, `clampOpacity`, etc.
- **Testing**: add unit tests for:
  - `getSceneAtTime`
  - transition window computation
  - animation evaluation in `getAnimatedProps`
  - z-index normalization

## Suggested roadmap (practical + aligned with your goal)

### Phase 1: Deterministic core (foundation)
- Deterministic `renderFrame(t)` with transitions.
- Preview uses the same renderer as export.
- Fix z-index ordering and batch element deletion.

### Phase 2: Export “MVP quality”
- Native ffmpeg export in Electron (MP4 H.264).
- Add audio mux/mix for at least 1 background track + 1 voiceover track.
- Add export presets (1080p/4k, fps, bitrate, CRF).

### Phase 3: Education/science differentiators
- LaTeX/math text rendering pipeline (KaTeX → vector or raster; cached).
- Code highlighting rendered deterministically (Monaco is heavy; consider Shiki for export rendering).
- Diagram primitives: arrows with labels, callouts, braces, highlight boxes, “step-by-step reveal”.

## Concrete next actions (highest ROI)

1) ✅ **Rename/fix** `exportToMP4` (it’s WebM) → `exportToWebM` exists; `exportToMP4` is deprecated wrapper.
2) ✅ Replace frame capture `toDataURL → Image` with `stage.toCanvas()` or direct canvas extraction.
3) Implement `normalizeZIndices(scene)` and call it consistently.
4) ✅ Refactor `ffmpegExporter` to avoid JS `frames[]` buffering and apply transitions.
5) Add a minimal audio mux/mix step for export.

