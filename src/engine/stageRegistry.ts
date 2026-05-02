import type Konva from 'konva'

// Module-level singleton — keeps the Konva stage out of Zustand/Immer
// so the ref object is never frozen.
let _stage: Konva.Stage | null = null

export function registerStage(stage: Konva.Stage | null) {
  _stage = stage
}

export function getStage(): Konva.Stage | null {
  return _stage
}
