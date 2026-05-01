import { Group, Rect, Text } from 'react-konva'
import type { CodeElement } from '../../../types/editor'

interface Props {
  el: CodeElement
  konvaProps: Record<string, unknown>
}

const PADDING     = 14
const LINE_NUMBER_W = 30

export default function CodeKonva({ el, konvaProps }: Props) {
  const lines    = el.code.split('\n')
  const lineH    = el.fontSize * 1.6
  const numW     = el.showLineNumbers ? LINE_NUMBER_W : 0

  return (
    <Group {...konvaProps} width={el.width} height={el.height}>
      {/* Background */}
      <Rect
        width={el.width} height={el.height}
        fill="#0d1117" cornerRadius={6}
        stroke="#30363d" strokeWidth={1}
      />

      {/* Header bar */}
      <Rect width={el.width} height={28} fill="#161b22" cornerRadius={[6, 6, 0, 0]} />
      <Text x={12} y={8} text={el.language.toUpperCase()} fontSize={9} fill="#8b949e" fontFamily="Consolas, monospace" />

      {/* Line number gutter */}
      {el.showLineNumbers && (
        <Rect x={PADDING} y={28} width={numW} height={el.height - 28} fill="#0d1117" />
      )}

      {/* Code lines */}
      {lines.map((line, i) => {
        const y = 28 + PADDING + i * lineH
        if (y > el.height - PADDING) return null
        return (
          <Group key={i}>
            {el.showLineNumbers && (
              <Text
                x={PADDING} y={y}
                text={String(i + 1)}
                fontSize={el.fontSize} fontFamily="Consolas, 'Courier New', monospace"
                fill="#484f58" align="right" width={numW - 8}
              />
            )}
            <Text
              x={PADDING + numW} y={y}
              text={line}
              fontSize={el.fontSize} fontFamily="Consolas, 'Courier New', monospace"
              fill="#e6edf3"
              width={el.width - PADDING * 2 - numW}
            />
          </Group>
        )
      })}
    </Group>
  )
}
