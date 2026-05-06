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
      renderMorphTransition(ctx, width, height, progress, fromCanvas, toCanvas)
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
  // Old scene stays in place, new scene slides in
  ctx.drawImage(from, 0, 0, w, h)
  
  let x = 0, y = 0
  switch (dir) {
    case 'left':  x = w * (1 - t); break
    case 'right': x = -w * (1 - t); break
    case 'up':    y = h * (1 - t); break
    case 'down':  y = -h * (1 - t); break
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
  // Both scenes move together
  let fromX = 0, fromY = 0, toX = 0, toY = 0
  
  switch (dir) {
    case 'left':
      fromX = -w * t
      toX = w * (1 - t)
      break
    case 'right':
      fromX = w * t
      toX = -w * (1 - t)
      break
    case 'up':
      fromY = -h * t
      toY = h * (1 - t)
      break
    case 'down':
      fromY = h * t
      toY = -h * (1 - t)
      break
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
  from: HTMLCanvasElement,
  to: HTMLCanvasElement
): void {
  // Pixelate effect with cross-fade
  const pixelSize = Math.max(1, Math.floor(20 * (1 - Math.abs(t - 0.5) * 2)))
  
  // Draw old scene
  ctx.globalAlpha = 1 - t
  drawPixelated(ctx, from, w, h, pixelSize)
  
  // Draw new scene
  ctx.globalAlpha = t
  drawPixelated(ctx, to, w, h, pixelSize)
  
  ctx.globalAlpha = 1
}

function drawPixelated(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  pixelSize: number
): void {
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!
  
  const cols = Math.ceil(w / pixelSize)
  const rows = Math.ceil(h / pixelSize)
  
  tempCanvas.width = cols
  tempCanvas.height = rows
  
  tempCtx.drawImage(canvas, 0, 0, cols, rows)
  
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tempCanvas, 0, 0, cols, rows, 0, 0, w, h)
  ctx.imageSmoothingEnabled = true
}

/**
 * Easing function for smooth transitions
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}
