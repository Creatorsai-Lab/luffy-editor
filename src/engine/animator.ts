import type { EditorElement, ElementAnimation, EasingType } from '../types/editor'

// ─── Easing ───────────────────────────────────────────────────────────────────

function ease(t: number, fn: EasingType): number {
  t = Math.max(0, Math.min(1, t))
  switch (fn) {
    case 'easeIn':    return t * t
    case 'easeOut':   return t * (2 - t)
    case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    case 'bounce': {
      const n1 = 7.5625, d1 = 2.75
      if (t < 1 / d1)      return n1 * t * t
      if (t < 2 / d1)      return n1 * (t -= 1.5 / d1) * t + 0.75
      if (t < 2.5 / d1)    return n1 * (t -= 2.25 / d1) * t + 0.9375
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
    default: return t
  }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// ─── Animated props snapshot ──────────────────────────────────────────────────

export interface AnimatedProps {
  x: number; y: number
  opacity: number
  scaleX: number; scaleY: number
  rotation: number
  // typewriter progress (0–1) for text reveal
  textProgress: number
}

export function getAnimatedProps(el: EditorElement, localTime: number): AnimatedProps {
  const props: AnimatedProps = {
    x: el.x, y: el.y,
    opacity: el.opacity,
    scaleX: 1, scaleY: 1,
    rotation: el.rotation,
    textProgress: 1
  }

  // Collect all entrance animations — pre-compute "before first entrance" state
  const entrances = el.animations.filter(a =>
    ['fadeIn', 'slideIn', 'scaleIn', 'typewriter'].includes(a.type)
  )
  if (entrances.length > 0) {
    const firstStart = Math.min(...entrances.map(a => a.startTime + a.delay))
    if (localTime < firstStart) {
      // Element invisible before its first entrance
      props.opacity = 0
      return props
    }
  }

  for (const anim of el.animations) {
    const start   = anim.startTime + anim.delay
    const end     = start + anim.duration
    const raw     = (localTime - start) / anim.duration
    const t       = ease(Math.max(0, Math.min(1, raw)), anim.easing)
    const before  = localTime < start
    const after   = localTime >= end

    applyAnim(anim, t, before, after, el, props)
  }

  return props
}

function applyAnim(
  anim: ElementAnimation,
  t: number,
  before: boolean,
  after: boolean,
  el: EditorElement,
  out: AnimatedProps
) {
  const dist = anim.params?.distance ?? 80

  switch (anim.type) {
    case 'fadeIn':
      if (before) { out.opacity = 0; return }
      if (after)  { out.opacity = el.opacity; return }
      out.opacity = lerp(0, el.opacity, t)
      break

    case 'fadeOut':
      if (after) { out.opacity = 0; return }
      if (before) return
      out.opacity = lerp(el.opacity, 0, t)
      break

    case 'slideIn': {
      const dir = anim.params?.direction ?? 'left'
      if (before) {
        out.opacity = 0
        if (dir === 'left')  out.x = el.x - dist
        if (dir === 'right') out.x = el.x + dist
        if (dir === 'up')    out.y = el.y - dist
        if (dir === 'down')  out.y = el.y + dist
        return
      }
      if (after) { out.x = el.x; out.y = el.y; out.opacity = el.opacity; return }
      out.opacity = lerp(0, el.opacity, t)
      if (dir === 'left')  out.x = lerp(el.x - dist, el.x, t)
      if (dir === 'right') out.x = lerp(el.x + dist, el.x, t)
      if (dir === 'up')    out.y = lerp(el.y - dist, el.y, t)
      if (dir === 'down')  out.y = lerp(el.y + dist, el.y, t)
      break
    }

    case 'slideOut': {
      const dir = anim.params?.direction ?? 'right'
      if (after) {
        out.opacity = 0
        if (dir === 'left')  out.x = el.x - dist
        if (dir === 'right') out.x = el.x + dist
        if (dir === 'up')    out.y = el.y - dist
        if (dir === 'down')  out.y = el.y + dist
        return
      }
      if (before) return
      out.opacity = lerp(el.opacity, 0, t)
      if (dir === 'left')  out.x = lerp(el.x, el.x - dist, t)
      if (dir === 'right') out.x = lerp(el.x, el.x + dist, t)
      if (dir === 'up')    out.y = lerp(el.y, el.y - dist, t)
      if (dir === 'down')  out.y = lerp(el.y, el.y + dist, t)
      break
    }

    case 'scaleIn':
      if (before) { out.scaleX = 0; out.scaleY = 0; out.opacity = 0; return }
      if (after)  { out.scaleX = 1; out.scaleY = 1; out.opacity = el.opacity; return }
      out.scaleX  = lerp(0, 1, t)
      out.scaleY  = lerp(0, 1, t)
      out.opacity = lerp(0, el.opacity, t)
      break

    case 'scaleOut':
      if (after)  { out.scaleX = 0; out.scaleY = 0; out.opacity = 0; return }
      if (before) return
      out.scaleX  = lerp(1, 0, t)
      out.scaleY  = lerp(1, 0, t)
      out.opacity = lerp(el.opacity, 0, t)
      break

    case 'typewriter':
      if (before) { out.textProgress = 0; return }
      if (after)  { out.textProgress = 1; return }
      out.textProgress = t
      break

    case 'spin':
      if (before || after) return
      out.rotation = el.rotation + lerp(0, 360, t)
      break
  }
}

// ─── Background animation helper ─────────────────────────────────────────────

export function drawAnimatedBg(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  colors: string[],
  variant: string,
  speed: number
) {
  const t = (time * speed * 0.1) % 1

  if (variant === 'gradient-flow') {
    const angle = t * Math.PI * 2
    const cx = w / 2 + Math.cos(angle) * w * 0.3
    const cy = h / 2 + Math.sin(angle) * h * 0.3
    const grad = ctx.createRadialGradient(cx, cy, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
    const c1 = colors[0] ?? '#6366f1'
    const c2 = colors[1] ?? '#0f0f1a'
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  } else if (variant === 'wave') {
    ctx.fillStyle = colors[1] ?? '#0f0f1a'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = colors[0] ?? '#6366f1'
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.moveTo(0, h * 0.5)
    for (let x = 0; x <= w; x += 4) {
      const y = h * 0.5 + Math.sin((x / w) * Math.PI * 4 + t * Math.PI * 2) * h * 0.1
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 1
  } else {
    // particles fallback — just gradient
    const grad = ctx.createLinearGradient(0, 0, w, h)
    const c1 = colors[0] ?? '#6366f1'
    const c2 = colors[1] ?? '#0f0f1a'
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }
}
