// Renders LaTeX to a self-contained SVG using MathJax's prebuilt browser bundle.
//
// IMPORTANT: we load `mathjax-full/es5/tex-svg.js` (the standalone bundle that
// attaches window.MathJax) instead of importing `mathjax-full/js/*`. The /js/
// tree is CommonJS and uses `require`, which is undefined in a Vite/ESM browser
// bundle → "require is not defined" crash. The es5 bundle is browser-ready.
//
// The `?url` import makes Vite emit the file and hand us a URL that resolves in
// both dev and the packaged Electron app. fontCache:'local' makes each SVG embed
// its own glyph paths, so the serialized markup renders standalone in an <img>.

import mathjaxUrl from 'mathjax-full/es5/tex-svg.js?url'

interface MathJaxGlobal {
  tex2svg: (tex: string, opts?: { display?: boolean }) => HTMLElement
  startup?: { promise?: Promise<unknown> }
}
function mj(): MathJaxGlobal | undefined {
  return (window as unknown as { MathJax?: MathJaxGlobal }).MathJax
}

let loadPromise: Promise<boolean> | null = null

function loadMathJax(): Promise<boolean> {
  if (loadPromise) return loadPromise
  loadPromise = new Promise<boolean>((resolve) => {
    if (mj()?.tex2svg) { resolve(true); return }
    // Configure BEFORE the bundle runs: don't auto-typeset the page; self-contained SVG.
    ;(window as unknown as { MathJax?: unknown }).MathJax = {
      startup: { typeset: false },
      svg: { fontCache: 'local' },
    }
    const s = document.createElement('script')
    s.src = mathjaxUrl
    s.async = true
    s.onload = () => {
      const m = mj()
      if (m?.startup?.promise) m.startup.promise.then(() => resolve(!!mj()?.tex2svg)).catch(() => resolve(false))
      else resolve(!!m?.tex2svg)
    }
    s.onerror = () => { console.error('[latexRenderer] failed to load MathJax bundle'); resolve(false) }
    document.head.appendChild(s)
  })
  return loadPromise
}

export interface LatexRender {
  svg: string       // self-contained SVG markup, sized in px, colored
  width: number     // px
  height: number    // px
}

/**
 * Convert LaTeX source to a colored, pixel-sized SVG.
 * @param latex raw LaTeX (without surrounding $$)
 * @param color CSS color applied to the equation
 * @param fontSize controls the rendered scale (≈ px per em)
 */
export async function renderLatex(latex: string, color: string, fontSize: number): Promise<LatexRender | null> {
  if (!latex.trim()) return null
  const ok = await loadMathJax()
  const m = mj()
  if (!ok || !m?.tex2svg) return null
  try {
    const container = m.tex2svg(latex, { display: true })
    const svgEl = container.querySelector('svg') as SVGSVGElement | null
    if (!svgEl) return null

    // MathJax sets width/height in 'ex'. Convert to px (1ex ≈ fontSize * 0.5).
    const wEx = parseFloat(svgEl.getAttribute('width') || '10')
    const hEx = parseFloat(svgEl.getAttribute('height') || '4')
    const pxPerEx = fontSize * 0.5
    const width  = Math.max(1, Math.round(wEx * pxPerEx))
    const height = Math.max(1, Math.round(hEx * pxPerEx))

    svgEl.setAttribute('width', String(width))
    svgEl.setAttribute('height', String(height))
    svgEl.style.color = color  // glyph paths use currentColor

    const markup = new XMLSerializer().serializeToString(svgEl)
    return { svg: markup, width, height }
  } catch (e) {
    console.error('[latexRenderer] parse error:', e)
    return null
  }
}

/** Build a data-URL usable as an <img>/Konva image source. */
export function latexToDataUrl(svgMarkup: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup)
}
