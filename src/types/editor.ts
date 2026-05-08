// ─── Element subtypes ────────────────────────────────────────────────────────

export type ElementType   = 'text' | 'shape' | 'arrow' | 'code' | 'image' | 'table' | 'chart' | 'video' | 'audio'
export type ShapeType     = 'rect' | 'circle' | 'triangle' | 'star' | 'pentagon' | 'hexagon' | 'octagon' | 'diamond' | 'oval' | 'speechBubble' | 'roundedSpeech' | 'cone'
export type AnimationType = 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'scaleIn' | 'scaleOut' | 'typewriter' | 'drawPath' | 'spin' | 'pulse' | 'bounceLoop' | 'rotateLoop' | 
  // Text-specific animations
  'typewriterChars' | 'typewriterWords' | 'textFade' | 'textBurst' | 'textBounce' | 'textBlock' | 'textSquiz' | 'textSpread' | 'textTwirl' | 'textZoomIn' | 'textZoomOut'

export type AnimationTiming = 'onEnter' | 'onExit' | 'loop'
export type TextEffectType = 'shadow' | 'glow' | 'outline' | 'hollow' | 'glitch' | 'bubble'
export type EasingType    = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce'
export type AlignType     = 'left' | 'center' | 'right'
export type ArrowHeadType = 'none' | 'end' | 'start' | 'both'
export type SlideDir      = 'left' | 'right' | 'up' | 'down'
export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom' | 'wipe' | 'push' | 'morph'
export type BgType        = 'solid' | 'gradient' | 'grid' | 'dots' | 'animated'
export type FontWeight    = 'normal' | 'medium' | 'semibold' | 'bold'
export type ActiveTool    = 'select' | 'text' | 'shape-rect' | 'shape-circle' | 'shape-triangle' | 'shape-star' | 'shape-pentagon' | 'shape-hexagon' | 'shape-octagon' | 'shape-diamond' | 'shape-oval' | 'shape-speechBubble' | 'shape-roundedSpeech' | 'shape-cone' | 'arrow' | 'code' | 'table' | 'image' | 'chart' | 'video'
export type ActivePanel   = 'text' | 'shapes' | 'arrows' | 'code' | 'table' | 'upload' | 'textAnimations' | 'shapeAnimations' | 'textEffects' | 'background' | 'layers' | 'transitions' | 'charts' | null

// ─── Animation ───────────────────────────────────────────────────────────────

export interface ElementAnimation {
  id: string
  type: AnimationType
  timing: AnimationTiming  // onEnter, onExit, or loop
  startTime: number   // seconds from scene start
  duration: number    // seconds
  delay: number       // seconds
  easing: EasingType
  params?: {
    direction?: SlideDir
    distance?: number
  }
}

// ─── Base element ─────────────────────────────────────────────────────────────

export interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
  locked: boolean
  visible: boolean
  name: string
  animations: ElementAnimation[]
}

// ─── Concrete elements ────────────────────────────────────────────────────────

export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: string
  fontWeight: FontWeight
  italic: boolean
  color: string
  align: AlignType
  lineHeight: number
  letterSpacing: number
  underline: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  textStroke: string
  textStrokeWidth: number
  stretchX: number
  stretchY: number
  effects?: TextEffectType[]  // New: text effects
}

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shapeType: ShapeType
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius: number
}

export interface ArrowElement extends BaseElement {
  type: 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
  stroke: string
  strokeWidth: number
  arrowHead: ArrowHeadType
  dashed: boolean
  dotted: boolean
  pointerLength: number
  pointerWidth: number
  arrowHeadColor: string
  curve: number
}

export interface CodeElement extends BaseElement {
  type: 'code'
  code: string
  language: string
  fontSize: number
  showLineNumbers: boolean
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  assetId: string
  cornerRadius: number
}

export interface TableElement extends BaseElement {
  type: 'table'
  rows: number
  cols: number
  cells: string[][]
  cellWidth: number
  cellHeight: number
  borderColor: string
  borderWidth: number
  headerBg: string
  cellBg: string
  textColor: string
  fontSize: number
  showHeader: boolean
}

export interface ChartElement extends BaseElement {
  type: 'chart'
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'area'
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      color: string
    }[]
  }
  showLegend: boolean
  showGrid: boolean
  backgroundColor: string
}

export interface VideoElement extends BaseElement {
  type: 'video'
  src: string
  assetId: string
  cornerRadius: number
  volume: number
  playbackRate: number
  loop: boolean
  muted: boolean
}

export interface AudioElement extends BaseElement {
  type: 'audio'
  src: string
  assetId: string
  volume: number
  fadeIn: number
  fadeOut: number
  startTime: number  // Trim start (seconds)
  duration: number   // Trim duration (seconds)
  loop: boolean
  track: 'background' | 'voiceover'
}

export type EditorElement = TextElement | ShapeElement | ArrowElement | CodeElement | ImageElement | TableElement | ChartElement | VideoElement | AudioElement

// ─── Background ───────────────────────────────────────────────────────────────

export interface SolidBg     { type: 'solid';    color: string }
export interface GradientBg  { type: 'gradient'; from: string; to: string; angle: number; fromStop: number; toStop: number }
export interface GridBg      { type: 'grid';     bgColor: string; lineColor: string; cellSize: number }
export interface DotsBg      { type: 'dots';     bgColor: string; dotColor: string; spacing: number; radius: number }
export interface AnimatedBg  { type: 'animated'; variant: 'gradient-flow' | 'particles' | 'wave'; colors: string[]; speed: number }
export type Background = SolidBg | GradientBg | GridBg | DotsBg | AnimatedBg

// ─── Scene ────────────────────────────────────────────────────────────────────

export interface SceneTransition {
  type: TransitionType
  duration: number
  direction?: SlideDir
}

export interface Scene {
  id: string
  name: string
  duration: number
  background: Background
  elements: EditorElement[]
  transition: SceneTransition
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface AssetMeta {
  id: string
  filename: string
  path: string
  type: 'image' | 'video' | 'audio'
  name: string
  duration?: number  // For audio/video
}

export interface Project {
  id: string
  name: string
  width: number
  height: number
  fps: number
  scenes: Scene[]
  assets: AssetMeta[]
  createdAt: number
  updatedAt: number
}

// ─── Canvas size presets ──────────────────────────────────────────────────────

export interface CanvasPreset {
  label: string
  width: number
  height: number
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { label: 'Horizontal HD', width: 1920, height: 1080 },
  { label: 'Vertical HD',   width: 1080, height: 1920 },
  { label: 'Square HD',     width: 1080, height: 1080 },
  { label: '4K',            width: 3840, height: 2160 }
]

export const FONT_FAMILIES = [
  'Segoe UI', 'Arial', 'Georgia', 'Courier New', 'Impact',
  'Verdana', 'Trebuchet MS', 'Tahoma', 'Times New Roman', 'Consolas'
]

export const LANGUAGES = [
  'javascript', 'typescript', 'python', 'rust', 'go', 'java',
  'cpp', 'c', 'bash', 'sql', 'json', 'yaml', 'html', 'css', 'markdown'
]
