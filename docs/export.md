# Export

Luffy Editor exports your project as a video (MP4) or as still images (PNG or WebP). Click **Export** in the left sidebar to open the export panel.

---

## Video Export — MP4

Renders every scene in sequence, bakes all animations and transitions, and produces a single MP4 file.

### Steps

1. Click **Export** → select **Video (MP4)**
2. Review the summary: dimensions, FPS, duration, total frames, estimated size
3. Choose a **quality preset** (720p / 1080p)
4. Click **Export Video**
5. A save dialog opens — choose a location and filename
6. A progress bar shows percentage + current status
7. When complete, the file is ready at the chosen path

### Quality Presets

| Preset | Output Resolution | Notes |
|---|---|---|
| 720p | 1280 × 720 (scaled) | Smaller file, faster export |
| 1080p | 1920 × 1080 (scaled) | Full HD; recommended for final delivery |

The canvas is scaled proportionally to the chosen resolution regardless of the original canvas size preset.

### Cancelling

Click **Cancel** during export to stop rendering. Partial output is discarded.

### Requirements

Luffy Editor uses FFmpeg bundled with the app. No additional software needs to be installed.

---

## Image Export — PNG / WebP

Exports a single scene as a still image at the canvas's native resolution.

### Steps

1. Click **Export** → select **Image (PNG)** or **Image (WebP)**
2. Use the **scene dropdown** to select which scene to capture
3. Click **Export Image**
4. A save dialog opens — the default filename includes the project and scene name
5. After saving, an **Open Folder** button appears to reveal the file in Explorer

### Capture time

The snapshot is taken at the point when all *On Enter* animations have finished — so the scene appears fully revealed, not mid-animation.

---

## Export Metadata Panel

Before exporting you can review:

| Field | Value |
|---|---|
| Canvas Size | original project dimensions (e.g. 1080 × 1920) |
| Export Resolution | scaled output dimensions |
| FPS | frames per second |
| Duration | total scene duration in seconds |
| Total Frames | FPS × duration |
| Estimated Size | rough file size estimate |

---

## Tips

**Keep scenes short for faster iteration** — a 10 s scene at 30 FPS = 300 frames. Export 1 scene at a time to check output before rendering the full project.

**Use 1080p for final delivery** — most platforms (YouTube, LinkedIn, educational sites) accept 1920×1080. Use 720p for quick drafts or sharing in chat.

**PNG vs WebP for images** — WebP produces smaller files with equivalent quality. Use PNG when lossless fidelity is required (e.g. for print or further editing).

**Check the FPS setting** — the project FPS (set on the project) affects how smoothly animations render. 30 FPS is standard; 60 FPS produces smoother motion at the cost of double the frame count.
