import { v4 as uuid } from 'uuid'
import type {
  Project, Scene, Background, TextElement, ShapeElement,
  ArrowElement, CodeElement, ImageElement, TableElement, ChartElement, VideoElement, AudioElement,
  ElementAnimation, SceneTransition, ShapeType
} from '../types/editor'

export const DEFAULT_BG: Background = { type: 'solid', color: '#fffaf7' }

export const DEFAULT_TRANSITION: SceneTransition = { type: 'none', duration: 0.5 }

export function makeScene(index = 1): Scene {
  return {
    id: uuid(),
    name: `Scene ${index}`,
    duration: 5,
    background: { ...DEFAULT_BG },
    elements: [],
    transition: { ...DEFAULT_TRANSITION }
  }
}

export function makeProject(id: string, name: string): Project {
  return {
    id, name,
    width: 1920, height: 1080, fps: 30,
    scenes: [makeScene(1)],
    assets: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

export function makeText(x: number, y: number): TextElement {
  return {
    id: uuid(), type: 'text', name: 'Text',
    x, y, width: 500, height: 60,
    rotation: 0, opacity: 1, zIndex: 0, locked: false, visible: true,
    animations: [],
    content: 'Double-click to edit',
    fontSize: 45, fontFamily: 'Segoe UI', fontWeight: 'normal',
    italic: false, color: '#333333', align: 'left',
    lineHeight: 1.4, letterSpacing: 0, underline: false,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    textStroke: '',
    textStrokeWidth: 0,
    stretchX: 1,
    stretchY: 1,
  }
}

export function makeShape(type: ShapeType, x: number, y: number): ShapeElement {
  return {
    id: uuid(), type: 'shape', name: type.charAt(0).toUpperCase() + type.slice(1),
    x, y, width: 120, height: 120,
    rotation: 0, opacity: 1, zIndex: 0, locked: false, visible: true,
    animations: [],
    shapeType: type,
    fill: '#919191', stroke: 'transparent', strokeWidth: 0, cornerRadius: 8
  }
}

export function makeArrow(x1: number, y1: number, x2: number, y2: number): ArrowElement {
  return {
    id: uuid(), type: 'arrow', name: 'Arrow',
    x: Math.min(x1, x2), y: Math.min(y1, y2),
    width: Math.abs(x2 - x1) || 100, height: Math.abs(y2 - y1) || 4,
    rotation: 0, opacity: 1, zIndex: 0, locked: false, visible: true,
    animations: [],
    x1, y1, x2, y2,
    stroke: '#202020', strokeWidth: 3, arrowHead: 'none', dashed: false,
    dotted: false,
    pointerLength: 12,
    pointerWidth: 13,
    arrowHeadColor: '',
    curve: 0,
  }
}

export function makeCode(x: number, y: number): CodeElement {
  return {
    id: uuid(), type: 'code', name: 'Code Block',
    x, y, width: 480, height: 240,
    rotation: 0, opacity: 1, zIndex: 0, locked: false, visible: true,
    animations: [],
    code: '// Enter your code here\nconst hello = "world"\nconsole.log(hello)',
    language: 'javascript',
    fontSize: 14, showLineNumbers: true
  }
}

export function makeImage(x: number, y: number, src: string, assetId: string): ImageElement {
  return {
    id: uuid(), type: 'image', name: 'Image',
    x, y, width: 320, height: 240,
    rotation: 0, opacity: 1, zIndex: 0, locked: false, visible: true,
    animations: [],
    src, assetId, cornerRadius: 0
  }
}

export function makeTable(x: number, y: number): TableElement {
  const rows = 3, cols = 3
  return {
    id: uuid(), type: 'table', name: 'Table',
    x, y, width: cols * 120, height: rows * 40,
    rotation: 0, opacity: 1, zIndex: 0, locked: false, visible: true,
    animations: [],
    rows, cols,
    cells: Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => r === 0 ? `Header ${c + 1}` : '')
    ),
    cellWidth: 120, cellHeight: 40,
    borderColor: '#5c5c5c', borderWidth: 1,
    headerBg: '#555555', cellBg: '#141414',
    textColor: '#303030', fontSize: 13, showHeader: true
  }
}

export function makeAnimation(): ElementAnimation {
  return {
    id: uuid(),
    type: 'fadeIn',
    timing: 'onEnter',
    startTime: 0,
    duration: 0.6,
    delay: 0,
    easing: 'easeOut'
  }
}

export function makeChart(x: number, y: number): ChartElement {
  return {
    id: uuid(), type: 'chart', name: 'Chart',
    x, y, width: 400, height: 300,
    rotation: 0, opacity: 1, zIndex: 0, locked: false, visible: true,
    animations: [],
    chartType: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [{
        label: 'Dataset 1',
        data: [12, 19, 3, 5, 2],
        color: '#6366f1'
      }]
    },
    showLegend: true,
    showGrid: true,
    backgroundColor: '#1a1a2e'
  }
}

export function makeVideo(x: number, y: number, src: string, assetId: string): VideoElement {
  return {
    id: uuid(), type: 'video', name: 'Video',
    x, y, width: 640, height: 360,
    rotation: 0, opacity: 1, zIndex: 0, locked: false, visible: true,
    animations: [],
    src, assetId, cornerRadius: 0,
    volume: 1,
    playbackRate: 1,
    loop: false,
    muted: false
  }
}

export function makeAudio(src: string, assetId: string, duration: number): AudioElement {
  return {
    id: uuid(), type: 'audio', name: 'Audio',
    x: 0, y: 0, width: 100, height: 40,
    rotation: 0, opacity: 1, zIndex: 0, locked: false, visible: true,
    animations: [],
    src, assetId,
    volume: 1,
    speed: 1,
    fadeIn: 0,
    fadeOut: 0,
    startTime: 0,
    duration,
    loop: false,
    track: 'background'
  }
}
