import { useRef, useCallback } from 'react'
import type Konva from 'konva'
import { useEditorStore } from '../../store/editorStore'
import type { EditorElement } from '../../types/editor'
import type { AnimatedProps } from '../../engine/animator'
import TextKonva   from './elements/TextKonva'
import ShapeKonva  from './elements/ShapeKonva'
import ArrowKonva  from './elements/ArrowKonva'
import CodeKonva   from './elements/CodeKonva'
import ImageKonva  from './elements/ImageKonva'
import TableKonva  from './elements/TableKonva'
import ChartKonva  from './elements/ChartKonva'
import VideoKonva  from './elements/VideoKonva'
import AudioKonva  from './elements/AudioKonva'

interface Props {
  element:    EditorElement
  animProps:  ReturnType<typeof import('../../engine/animator').getAnimatedProps> | null
  isSelected: boolean
  onSelect:   (multi: boolean) => void
  onDblClick: () => void
  stageScale: number
}

export default function CanvasElement({ element, animProps, isSelected, onSelect, onDblClick, stageScale }: Props) {
  const { updateElement } = useEditorStore()

  const props = {
    id:       element.id,
    x:        animProps?.x        ?? element.x,
    y:        animProps?.y        ?? element.y,
    opacity:  animProps?.opacity  ?? element.opacity,
    scaleX:   element.type === 'text'
      ? (animProps?.scaleX ?? 1) * ((element as import('../../types/editor').TextElement).stretchX ?? 1)
      : (animProps?.scaleX ?? 1),
    scaleY:   element.type === 'text'
      ? (animProps?.scaleY ?? 1) * ((element as import('../../types/editor').TextElement).stretchY ?? 1)
      : (animProps?.scaleY ?? 1),
    rotation: animProps?.rotation ?? element.rotation,
    draggable: !element.locked,
    listening: !element.locked,
    onClick:  (e: Konva.KonvaEventObject<MouseEvent>) => onSelect(e.evt.shiftKey),
    onDblClick,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      if (element.type === 'arrow') {
        const el = element as import('../../types/editor').ArrowElement
        const dx = e.target.x(), dy = e.target.y()
        e.target.x(0); e.target.y(0)
        updateElement(element.id, { x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy })
      } else {
        updateElement(element.id, { x: e.target.x(), y: e.target.y() })
      }
    },
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      
      if (element.type === 'arrow') {
        const el = element as import('../../types/editor').ArrowElement
        const dx = node.x(), dy = node.y()
        const sX = scaleX, sY = scaleY
        const rot = node.rotation() * Math.PI / 180
        const transform = (px: number, py: number) => ({
          x: dx + (px * sX) * Math.cos(rot) - (py * sY) * Math.sin(rot),
          y: dy + (px * sX) * Math.sin(rot) + (py * sY) * Math.cos(rot),
        })
        const p1 = transform(el.x1, el.y1), p2 = transform(el.x2, el.y2)
        node.x(0); node.y(0); node.scaleX(1); node.scaleY(1); node.rotation(0)
        updateElement(element.id, { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
      } else {
        const newWidth = Math.max(10, Math.abs(node.width() * scaleX))
        const newHeight = Math.max(10, Math.abs(node.height() * scaleY))
        
        updateElement(element.id, {
          x:        node.x(),
          y:        node.y(),
          width:    newWidth,
          height:   newHeight,
          rotation: node.rotation()
        })
        
        // Reset scale to 1 after applying dimensions
        node.scaleX(1)
        node.scaleY(1)
      }
    }
  }

  switch (element.type) {
    case 'text':   return <TextKonva   el={element} konvaProps={props} textProgress={animProps?.textProgress ?? 1} />
    case 'shape':  return <ShapeKonva  el={element} konvaProps={props} />
    case 'arrow':  return <ArrowKonva  el={element} konvaProps={props} />
    case 'code':   return <CodeKonva   el={element} konvaProps={props} />
    case 'image':  return <ImageKonva  el={element} konvaProps={props} />
    case 'table':  return <TableKonva  el={element} konvaProps={props} />
    case 'chart':  return <ChartKonva  el={element} konvaProps={props} />
    case 'video':  return <VideoKonva  el={element} konvaProps={props} />
    case 'audio':  return null // Audio only appears in timeline, not on canvas
    default:       return null
  }
}
