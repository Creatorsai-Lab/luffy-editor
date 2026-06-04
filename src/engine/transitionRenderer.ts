import type { TransitionType, SlideDir } from '../types/editor'

export interface TransitionRenderOptions {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  progress: number  // 0 to 1
  type: TransitionType
  direction?: SlideDir
  fromCanvas: HTMLCanvasElement
  toCanvas: HTMLCanvasElement
}

/**
 * Renders a transition between two scene canvases
 * @param opts Transition rendering options
 */
export function renderTransition(opts: TransitionRenderOptions): void {
  const { ctx, width, height, progress, type, direction, fromCanvas, toCanvas } = opts

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  switch (type) {
    case 'none':
      // No transition - just show the new scene
      ctx.drawImage(toCanvas, 0, 0, width, height)
      break

    case 'fade':
      renderFadeTransition(ctx, width, height, progress, fromCanvas, toCanvas)
      break

    case 'slide':
      renderSlideTransition(ctx, width, height, progress, direction ?? 'left', fromCanvas, toCanvas)
      break

    case 'push':
      renderPushTransition(ctx, width, height, progress, direction ?? 'left', fromCanvas, toCanvas)
      break

    case 'zoom':
      renderZoomTransition(ctx, width, height, progress, fromCanvas, toCanvas)
      break

    case 'wipe':
      renderWipeTransition(ctx, width, height, progress, direction ?? 'left', fromCanvas, toCanvas)
      break

    case 'morph':
      renderMorphTransition(ctx, width, height, progress, direction ?? 'right', fromCanvas, toCanvas)
      break

    default:
      // Fallback to fade
      renderFadeTransition(ctx, width, height, progress, fromCanvas, toCanvas)
  }
}

// ─── Transition Implementations ──────────────────────────────────────────────

function renderFadeTransition(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  from: HTMLCanvasElement,
  to: HTMLCanvasElement
): void {
  // Draw old scene
  ctx.globalAlpha = 1 - t
  ctx.drawImage(from, 0, 0, w, h)
  
  // Draw new scene
  ctx.globalAlpha = t
  ctx.drawImage(to, 0, 0, w, h)
  
  ctx.globalAlpha = 1
}

function renderSlideTransition(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  dir: SlideDir,
  from: HTMLCanvasElement,
  to: HTMLCanvasElement
): void {
  // Old scene stays in place, new scene slides in from `dir` edge.
  ctx.drawImage(from, 0, 0, w, h)

  let x = 0, y = 0
  switch (dir) {
    case 'right': x = w * (1 - t);  break  // enters from right
    case 'left':  x = -w * (1 - t); break  // enters from left
    case 'down':  y = h * (1 - t);  break  // enters from bottom
    case 'up':    y = -h * (1 - t); break  // enters from top
  }

  ctx.drawImage(to, x, y, w, h)
}

function renderPushTransition(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  dir: SlideDir,
  from: HTMLCanvasElement,
  to: HTMLCanvasElement
): void {
  // Both scenes move together. `dir` = edge the NEW scene enters from;
  // the old scene exits toward the opposite edge.
  let fromX = 0, fromY = 0, toX = 0, toY = 0

  switch (dir) {
    case 'right':  // new in from right, old out to left
      toX = w * (1 - t);  fromX = -w * t; break
    case 'left':   // new in from left, old out to right
      toX = -w * (1 - t); fromX = w * t;  break
    case 'down':   // new in from bottom, old out to top
      toY = h * (1 - t);  fromY = -h * t; break
    case 'up':     // new in from top, old out to bottom
      toY = -h * (1 - t); fromY = h * t;  break
  }

  ctx.drawImage(from, fromX, fromY, w, h)
  ctx.drawImage(to, toX, toY, w, h)
}

function renderZoomTransition(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  from: HTMLCanvasElement,
  to: HTMLCanvasElement
): void {
  // Old scene zooms out, new scene zooms in
  const fromScale = 1 + t * 0.5
  const toScale = 0.5 + t * 0.5
  
  // Draw old scene (zooming out and fading)
  ctx.globalAlpha = 1 - t
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(fromScale, fromScale)
  ctx.translate(-w / 2, -h / 2)
  ctx.drawImage(from, 0, 0, w, h)
  ctx.restore()
  
  // Draw new scene (zooming in and fading in)
  ctx.globalAlpha = t
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(toScale, toScale)
  ctx.translate(-w / 2, -h / 2)
  ctx.drawImage(to, 0, 0, w, h)
  ctx.restore()
  
  ctx.globalAlpha = 1
}

function renderWipeTransition(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  dir: SlideDir,
  from: HTMLCanvasElement,
  to: HTMLCanvasElement
): void {
  // Draw old scene
  ctx.drawImage(from, 0, 0, w, h)
  
  // Wipe with new scene
  ctx.save()
  ctx.beginPath()
  
  switch (dir) {
    case 'left':
      ctx.rect(0, 0, w * t, h)
      break
    case 'right':
      ctx.rect(w * (1 - t), 0, w * t, h)
      break
    case 'up':
      ctx.rect(0, 0, w, h * t)
      break
    case 'down':
      ctx.rect(0, h * (1 - t), w, h * t)
      break
  }
  
  ctx.clip()
  ctx.drawImage(to, 0, 0, w, h)
  ctx.restore()
}

function renderMorphTransition(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  dir: SlideDir,
  from: HTMLCanvasElement,
  to: HTMLCanvasElement
): void {
  // PowerPoint-style "Morph" approximation: the old scene scales up slightly and
  // drifts in `dir` while fading out; the new scene starts a touch larger,
  // settles to 1×, and drifts in from the opposite side while fading in.
  // Eased so the motion accelerates then settles, reading as a smooth blend.
  const e = easeInOutCubic(t)
  const drift = Math.min(w, h) * 0.06   // max pan distance

  // Direction unit vector (where the new scene drifts TOWARD = `dir` edge feel)
  let dx = 0, dy = 0
  switch (dir) {
    case 'right': dx = 1;  break
    case 'left':  dx = -1; break
    case 'down':  dy = 1;  break
    case 'up':    dy = -1; break
  }

  const drawScaledPanned = (img: HTMLCanvasElement, scale: number, panX: number, panY: number, alpha: number) => {
    ctx.globalAlpha = alpha
    ctx.save()
    ctx.translate(w / 2 + panX, h / 2 + panY)
    ctx.scale(scale, scale)
    ctx.translate(-w / 2, -h / 2)
    ctx.drawImage(img, 0, 0, w, h)
    ctx.restore()
  }

  // Old: 1 → 1.08, pans toward dir, fades out
  drawScaledPanned(from, 1 + e * 0.08,  dx * drift * e,        dy * drift * e,        1 - e)
  // New: 1.08 → 1, pans in from opposite side, fades in
  drawScaledPanned(to,   1.08 - e * 0.08, -dx * drift * (1 - e), -dy * drift * (1 - e), e)

  ctx.globalAlpha = 1
}

/**
 * Easing function for smooth transitions
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}
