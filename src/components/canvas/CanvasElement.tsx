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
    scaleX:   animProps?.scaleX   ?? 1,
    scaleY:   animProps?.scaleY   ?? 1,
    rotation: animProps?.rotation ?? element.rotation,
    draggable: !element.locked,
    listening: !element.locked,
    onClick:  (e: Konva.KonvaEventObject<MouseEvent>) => onSelect(e.evt.shiftKey),
    onDblClick,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      updateElement(element.id, { x: e.target.x(), y: e.target.y() })
    },
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target
      updateElement(element.id, {
        x:        node.x(),
        y:        node.y(),
        width:    Math.abs(node.width()  * node.scaleX()),
        height:   Math.abs(node.height() * node.scaleY()),
        rotation: node.rotation()
      })
      node.scaleX(1); node.scaleY(1)
    }
  }

  switch (element.type) {
    case 'text':   return <TextKonva   el={element} konvaProps={props} textProgress={animProps?.textProgress ?? 1} />
    case 'shape':  return <ShapeKonva  el={element} konvaProps={props} />
    case 'arrow':  return <ArrowKonva  el={element} konvaProps={props} />
    case 'code':   return <CodeKonva   el={element} konvaProps={props} />
    case 'image':  return <ImageKonva  el={element} konvaProps={props} />
    case 'table':  return <TableKonva  el={element} konvaProps={props} />
    default:       return null
  }
}
