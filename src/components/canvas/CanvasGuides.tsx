import { Line } from 'react-konva'
import { useCanvasStore } from '../../store/canvasStore'

interface Props {
  width: number
  height: number
}

export default function CanvasGuides({ width, height }: Props) {
  const { showGuides, guides } = useCanvasStore()

  if (!showGuides) return null

  return (
    <>
      {guides.map(guide => {
        if (guide.type === 'horizontal') {
          return (
            <Line
              key={guide.id}
              points={[0, guide.position, width, guide.position]}
              stroke="#6366f1"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )
        } else {
          return (
            <Line
              key={guide.id}
              points={[guide.position, 0, guide.position, height]}
              stroke="#6366f1"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )
        }
      })}
    </>
  )
}
