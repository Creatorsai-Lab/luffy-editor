import type { EditorElement, ElementAnimation, EasingType, SlideDir } from '../types/editor'

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
  offsetX: number; offsetY: number
  textProgress: number
  textMode: 'chars' | 'words' | 'draw' | undefined
  dashOffset: number
  wipeProgress: number
  wipeDir: SlideDir | undefined
}

export function getAnimatedProps(el: EditorElement, localTime: number): AnimatedProps {
  const props: AnimatedProps = {
    x: el.x, y: el.y,
    opacity: el.opacity,
    scaleX: 1, scaleY: 1,
    rotation: el.rotation,
    offsetX: 0, offsetY: 0,
    textProgress: 1,
    textMode: undefined,
    dashOffset: 0,
    wipeProgress: 1,
    wipeDir: undefined,
  }

  const anims = el.animations
  if (anims.length === 0) return props

  // Loop animations are identified by type (canonical) OR by timing field.
  // This guards against old saved projects where loop-type animations were
  // incorrectly stored with timing='onEnter'.
  const LOOP_TYPES = new Set(['pulse', 'bounceLoop', 'rotateLoop', 'flowLoop', 'fadeLoop'])
  const isLoop = (a: ElementAnimation) => LOOP_TYPES.has(a.type) || a.timing === 'loop'

  const enters = anims.filter(a => !isLoop(a) && a.timing === 'onEnter')
  const exits  = anims.filter(a => !isLoop(a) && a.timing === 'onExit')
  const loops  = anims.filter(a => isLoop(a))

  // Guard against NaN from undefined/missing fields on older saved animations
  const safe = (v: number | undefined) => (v != null && isFinite(v) ? v : 0)

  // ── Visibility window ──────────────────────────────────────────────────────
  // firstEnterStart: when the EARLIEST enter animation begins
  // lastEnterEnd:    when ALL enter animations have finished
  // firstExitStart:  when the EARLIEST exit animation begins
  // lastExitEnd:     when ALL exit animations have finished
  const firstEnterStart = enters.length > 0
    ? Math.min(...enters.map(a => safe(a.startTime) + safe(a.delay)))
    : -Infinity

  const lastEnterEnd = enters.length > 0
    ? Math.max(...enters.map(a => safe(a.startTime) + safe(a.delay) + safe(a.duration)))
    : 0

  const firstExitStart = exits.length > 0
    ? Math.min(...exits.map(a => safe(a.startTime) + safe(a.delay)))
    : Infinity

  const lastExitEnd = exits.length > 0
    ? Math.max(...exits.map(a => safe(a.startTime) + safe(a.delay) + safe(a.duration)))
    : Infinity

  // Before first enter: element is invisible — return early, no animations run
  if (enters.length > 0 && localTime < firstEnterStart) {
    props.opacity     = 0
    props.textProgress = 0
    return props
  }

  // After last exit: element is invisible — return early
  if (exits.length > 0 && localTime >= lastExitEnd) {
    props.opacity = 0
    return props
  }

  // ── Enter animations ───────────────────────────────────────────────────────
  for (const anim of enters) {
    const start  = safe(anim.startTime) + safe(anim.delay)
    const end    = start + safe(anim.duration)
    const before = localTime < start
    const after  = localTime >= end
    const raw    = (localTime - start) / anim.duration
    const t      = ease(Math.max(0, Math.min(1, raw)), anim.easing)
    applyAnim(anim, t, before, after, el, props, localTime)
  }

  // ── Exit animations ────────────────────────────────────────────────────────
  for (const anim of exits) {
    const start  = safe(anim.startTime) + safe(anim.delay)
    const end    = start + safe(anim.duration)
    const before = localTime < start
    const after  = localTime >= end
    const raw    = (localTime - start) / anim.duration
    const t      = ease(Math.max(0, Math.min(1, raw)), anim.easing)
    applyAnim(anim, t, before, after, el, props, localTime)
  }

  // ── Loop animations ────────────────────────────────────────────────────────
  // Loops run ONLY during the element's stable visible phase:
  //   • After ALL enter animations have completed (loopWindowStart)
  //   • Before ANY exit animation begins (loopWindowEnd)
  // If there are no enter animations, loops start from their own configured time.
  const loopWindowStart = enters.length > 0 ? lastEnterEnd : 0
  const loopWindowEnd   = firstExitStart

  for (const anim of loops) {
    const animStart      = safe(anim.startTime) + safe(anim.delay)
    const effectiveStart = Math.max(animStart, loopWindowStart)
    if (localTime < effectiveStart) continue
    if (localTime >= loopWindowEnd)  continue
    applyAnim(anim, 0, false, false, el, props, localTime, effectiveStart)
  }

  return props
}

function applyAnim(
  anim: ElementAnimation,
  t: number,
  before: boolean,
  after: boolean,
  el: EditorElement,
  out: AnimatedProps,
  localTime: number,
  loopStart?: number
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
      // Arrow label = direction of movement: ← Left means element moves left (enters from right)
      const dir = anim.params?.direction ?? 'right'
      if (before) {
        out.opacity = 0
        if (dir === 'left')  out.x = el.x + dist   // enters from right, moves left
        if (dir === 'right') out.x = el.x - dist   // enters from left, moves right
        if (dir === 'up')    out.y = el.y + dist   // enters from below, moves up
        if (dir === 'down')  out.y = el.y - dist   // enters from above, moves down
        return
      }
      if (after) { out.x = el.x; out.y = el.y; out.opacity = el.opacity; return }
      out.opacity = lerp(0, el.opacity, t)
      if (dir === 'left')  out.x = lerp(el.x + dist, el.x, t)
      if (dir === 'right') out.x = lerp(el.x - dist, el.x, t)
      if (dir === 'up')    out.y = lerp(el.y + dist, el.y, t)
      if (dir === 'down')  out.y = lerp(el.y - dist, el.y, t)
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
      if (anim.timing === 'onExit') {
        if (after)  { out.scaleX = 0; out.scaleY = 0; out.opacity = 0; return }
        if (before) return
        out.scaleX  = lerp(1, 0, t)
        out.scaleY  = lerp(1, 0, t)
        out.opacity = lerp(el.opacity, 0, t)
      } else {
        if (before) { out.scaleX = 0; out.scaleY = 0; out.opacity = 0; return }
        if (after)  { out.scaleX = 1; out.scaleY = 1; out.opacity = el.opacity; return }
        out.scaleX  = lerp(0, 1, t)
        out.scaleY  = lerp(0, 1, t)
        out.opacity = lerp(0, el.opacity, t)
      }
      break

    case 'scaleOut':
      if (anim.timing === 'onEnter') {
        if (before) { out.scaleX = 2.5; out.scaleY = 2.5; out.opacity = 0; return }
        if (after)  { out.scaleX = 1; out.scaleY = 1; out.opacity = el.opacity; return }
        out.scaleX  = lerp(2.5, 1, t)
        out.scaleY  = lerp(2.5, 1, t)
        out.opacity = lerp(0, el.opacity, t)
      } else {
        if (after)  { out.scaleX = 0; out.scaleY = 0; out.opacity = 0; return }
        if (before) return
        out.scaleX  = lerp(1, 0, t)
        out.scaleY  = lerp(1, 0, t)
        out.opacity = lerp(el.opacity, 0, t)
      }
      break

    case 'typewriter':
      if (before) { out.textProgress = 0; return }
      if (after)  { out.textProgress = 1; return }
      out.textProgress = t
      break

    case 'drawPath':
      if (before) { out.opacity = 0; out.textProgress = 0; return }
      if (after)  { out.opacity = el.opacity; out.textProgress = 1; return }
      out.textProgress = t
      out.opacity = lerp(0, el.opacity, t)
      break

    case 'spin':
      if (before || after) return
      out.rotation = el.rotation + lerp(0, 360, t)
      break

    case 'wipeIn': {
      const dir = (anim.params?.direction ?? 'right') as SlideDir
      if (before) { out.opacity = 0; out.wipeProgress = 0; out.wipeDir = dir; return }
      if (after)  { out.wipeProgress = 1; out.wipeDir = undefined; return }
      out.wipeProgress = t
      out.wipeDir = dir
      break
    }

    case 'wipeOut': {
      const dir = (anim.params?.direction ?? 'right') as SlideDir
      if (after)  { out.opacity = 0; out.wipeProgress = 0; out.wipeDir = dir; return }
      if (before) return
      out.wipeProgress = 1 - t
      out.wipeDir = dir
      break
    }

    // ─── Text-specific animations ───────────────────────────────────────────
    case 'typewriterChars':
      if (before) { out.opacity = 0; out.textProgress = 0; out.textMode = 'chars'; return }
      if (after)  { out.textProgress = 1; out.textMode = 'chars'; return }
      out.textProgress = t
      out.textMode = 'chars'
      break

    case 'typewriterWords':
      if (before) { out.opacity = 0; out.textProgress = 0; out.textMode = 'words'; return }
      if (after)  { out.textProgress = 1; out.textMode = 'words'; return }
      out.textProgress = t
      out.textMode = 'words'
      break

    case 'textFade':
      if (anim.timing === 'onExit') {
        if (after)  { out.opacity = 0; return }
        if (before) return
        out.opacity = lerp(el.opacity, 0, t)
      } else {
        if (before) { out.opacity = 0; return }
        if (after)  { out.opacity = el.opacity; return }
        out.opacity = lerp(0, el.opacity, t)
      }
      break

    // ─── Loop animations ────────────────────────────────────────────────────
    // loopStart is the effectiveStart passed from the loop dispatch section;
    // it is always >= anim.startTime+anim.delay so elapsed is always >= 0.
    case 'pulse': {
      if (before) return
      const elapsed = localTime - (loopStart ?? (anim.startTime + anim.delay))
      const phase   = (elapsed % anim.duration) / anim.duration
      const v       = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2)
      out.scaleX    = 0.88 + 0.24 * v
      out.scaleY    = out.scaleX
      break
    }

    case 'bounceLoop': {
      if (before) return
      const elapsed  = localTime - (loopStart ?? (anim.startTime + anim.delay))
      const phase    = (elapsed % anim.duration) / anim.duration
      const v        = Math.sin(phase * Math.PI * 2)
      const loopDist = anim.params?.distance ?? 24
      out.y = el.y + v * loopDist
      break
    }

    case 'rotateLoop': {
      if (before) return
      const elapsed = localTime - (loopStart ?? (anim.startTime + anim.delay))
      const turns   = elapsed / anim.duration
      out.rotation  = el.rotation + turns * 360
      out.offsetX   = el.width / 2
      out.offsetY   = el.height / 2
      break
    }

    // ─── Arrow-specific animations ──────────────────────────────────────────
    case 'drawOff':
      if (before) { out.textProgress = 1; return }
      if (after)  { out.textProgress = 0; out.opacity = 0; return }
      out.textProgress = lerp(1, 0, t)
      out.opacity = lerp(el.opacity, 0, Math.max(0, (t - 0.7) / 0.3))
      break

    case 'flowLoop': {
      if (before) return
      const elapsed = localTime - (loopStart ?? (anim.startTime + anim.delay))
      out.dashOffset = -(elapsed * 60) % 200
      break
    }

    case 'fadeLoop': {
      if (before) return
      const elapsed = localTime - (loopStart ?? (anim.startTime + anim.delay))
      const phase   = (elapsed % anim.duration) / anim.duration
      const v       = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2)
      out.opacity   = lerp(el.opacity * 0.1, el.opacity, v)
      break
    }
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
    const grad = ctx.createLinearGradient(0, 0, w, h)
    const c1 = colors[0] ?? '#6366f1'
    const c2 = colors[1] ?? '#0f0f1a'
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }
}
