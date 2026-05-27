import { Group, Rect, Line, Text, Circle, Path } from 'react-konva'
import type { ChartElement } from '../../../types/editor'

interface Props {
  el: ChartElement
  konvaProps: Record<string, unknown>
  animProgress?: number
}

export default function ChartKonva({ el, konvaProps, animProgress = 1 }: Props) {
  const { data, chartType, showLegend, showGrid, backgroundColor } = el
  const w = el.width
  const h = el.height
  const padding = 36
  const labelFontSize = el.fontSize ?? 10
  const labelColor = el.textColor ?? '#999999'
  const fontFamily = el.fontFamily ?? 'Arial'
  const lineWeight = el.lineWeight ?? 2
  const chartW = w - padding * 2
  const chartH = h - padding * 2 - (showLegend ? 28 : 0)

  const allValues = data.datasets.flatMap(ds => ds.data)
  const maxValue = Math.max(...allValues, 1)

  const renderBarChart = () => {
    const numGroups = data.labels.length
    const numBars = data.datasets.length
    const slotW = chartW / numGroups
    const barWidthRatio = el.barWidth ?? 0.8
    const spacingRatio = el.barSpacing ?? 0.12
    const groupSpacing = slotW * spacingRatio
    const groupW = slotW - groupSpacing
    const singleBarW = (groupW / numBars) * barWidthRatio
    const barGapW = (groupW / numBars) * (1 - barWidthRatio)

    return (
      <>
        {data.labels.map((label, i) => (
          <Group key={i}>
            {data.datasets.map((dataset, j) => {
              const value = dataset.data[i] ?? 0
              const barHeight = (value / maxValue) * chartH * animProgress
              const x = padding + i * slotW + groupSpacing / 2 + j * (groupW / numBars) + barGapW / 2
              const y = padding + chartH - barHeight
              return (
                <Rect
                  key={j}
                  x={x}
                  y={y}
                  width={singleBarW}
                  height={Math.max(0, barHeight)}
                  fill={dataset.color}
                />
              )
            })}
            <Text
              x={padding + i * slotW + groupSpacing / 2}
              y={padding + chartH + 5}
              text={label}
              fontSize={labelFontSize}
              fontFamily={fontFamily}
              fill={labelColor}
              width={groupW}
              align="center"
              opacity={animProgress}
            />
          </Group>
        ))}
      </>
    )
  }

  const renderLineChart = () => {
    const pointSpacing = chartW / (data.labels.length - 1 || 1)

    return (
      <>
        {data.datasets.map((dataset, dsIndex) => {
          const pts = dataset.data.map((value, i) => ({
            x: padding + i * pointSpacing,
            y: padding + chartH - (value / maxValue) * chartH,
          }))

          let drawPts: number[]
          let numDrawn: number

          if (animProgress >= 1 || pts.length < 2) {
            drawPts = pts.flatMap(p => [p.x, p.y])
            numDrawn = pts.length
          } else if (animProgress <= 0) {
            drawPts = []
            numDrawn = 0
          } else {
            const segs = pts.slice(1).map((pt, i) => {
              const dx = pt.x - pts[i].x
              const dy = pt.y - pts[i].y
              return Math.sqrt(dx * dx + dy * dy)
            })
            const totalLen = segs.reduce((a, b) => a + b, 0)
            const targetLen = totalLen * animProgress
            let drawn = 0
            drawPts = [pts[0].x, pts[0].y]
            numDrawn = 1
            for (let i = 0; i < segs.length; i++) {
              if (drawn + segs[i] <= targetLen) {
                drawn += segs[i]
                drawPts.push(pts[i + 1].x, pts[i + 1].y)
                numDrawn = i + 2
              } else {
                const frac = segs[i] > 0 ? (targetLen - drawn) / segs[i] : 0
                drawPts.push(
                  pts[i].x + (pts[i + 1].x - pts[i].x) * frac,
                  pts[i].y + (pts[i + 1].y - pts[i].y) * frac
                )
                break
              }
            }
          }

          return (
            <Group key={dsIndex}>
              {drawPts.length >= 4 && (
                <Line
                  points={drawPts}
                  stroke={dataset.color}
                  strokeWidth={lineWeight}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              {pts.map((pt, i) => {
                if (i >= numDrawn) return null
                return (
                  <Circle
                    key={i}
                    x={pt.x}
                    y={pt.y}
                    radius={Math.max(2, lineWeight + 1)}
                    fill={dataset.color}
                  />
                )
              })}
            </Group>
          )
        })}
        {data.labels.map((label, i) => (
          <Text
            key={i}
            x={padding + i * pointSpacing - 20}
            y={padding + chartH + 5}
            text={label}
            fontSize={labelFontSize}
            fontFamily={fontFamily}
            fill={labelColor}
            width={40}
            align="center"
            opacity={Math.max(0, Math.min(1, (animProgress - 0.75) / 0.25))}
          />
        ))}
      </>
    )
  }

  const renderAreaChart = () => {
    const pointSpacing = chartW / (data.labels.length - 1 || 1)
    const clipWidth = Math.max(0, chartW * animProgress)

    return (
      <>
        <Group clipX={padding} clipY={0} clipWidth={clipWidth} clipHeight={h}>
          {data.datasets.map((dataset, dsIndex) => {
            const points: number[] = []
            dataset.data.forEach((value, i) => {
              points.push(padding + i * pointSpacing, padding + chartH - (value / maxValue) * chartH)
            })
            const areaPoints = [
              ...points,
              padding + (data.labels.length - 1) * pointSpacing, padding + chartH,
              padding, padding + chartH,
            ]
            return (
              <Group key={dsIndex}>
                <Line points={areaPoints} fill={dataset.color} opacity={0.3} closed />
                <Line
                  points={points}
                  stroke={dataset.color}
                  strokeWidth={lineWeight}
                  lineCap="round"
                  lineJoin="round"
                />
              </Group>
            )
          })}
        </Group>
        {data.labels.map((label, i) => (
          <Text
            key={i}
            x={padding + i * pointSpacing - 20}
            y={padding + chartH + 5}
            text={label}
            fontSize={labelFontSize}
            fontFamily={fontFamily}
            fill={labelColor}
            width={40}
            align="center"
            opacity={Math.max(0, Math.min(1, (animProgress - 0.75) / 0.25))}
          />
        ))}
      </>
    )
  }

  const renderPieChart = () => {
    const centerX = w / 2
    const centerY = (h - (showLegend ? 30 : 0)) / 2
    const radius = Math.min(chartW, chartH) / 2 - 10
    const dataset = data.datasets[0]
    if (!dataset) return null
    const total = dataset.data.reduce((sum, val) => sum + val, 0) || 1
    const n = dataset.data.length
    let currentAngle = -Math.PI / 2

    return (
      <>
        {dataset.data.map((value, i) => {
          const sliceAngle = (value / total) * 2 * Math.PI
          const sp = Math.max(0, Math.min(1, animProgress * n - i))
          const endAngle = currentAngle + sliceAngle * sp
          const startX = centerX + radius * Math.cos(currentAngle)
          const startY = centerY + radius * Math.sin(currentAngle)
          const endX = centerX + radius * Math.cos(endAngle)
          const endY = centerY + radius * Math.sin(endAngle)
          const largeArc = sliceAngle * sp > Math.PI ? 1 : 0
          const pathData = sp > 0.001
            ? `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`
            : ''
          currentAngle += sliceAngle
          return pathData ? (
            <Path key={i} data={pathData} fill={dataset.color} opacity={1 - i * 0.15} />
          ) : null
        })}
      </>
    )
  }

  const renderDoughnutChart = () => {
    const centerX = w / 2
    const centerY = (h - (showLegend ? 30 : 0)) / 2
    const outerRadius = Math.min(chartW, chartH) / 2 - 10
    const innerRadius = outerRadius * 0.6
    const dataset = data.datasets[0]
    if (!dataset) return null
    const total = dataset.data.reduce((sum, val) => sum + val, 0) || 1
    const n = dataset.data.length
    let currentAngle = -Math.PI / 2

    return (
      <>
        {dataset.data.map((value, i) => {
          const sliceAngle = (value / total) * 2 * Math.PI
          const sp = Math.max(0, Math.min(1, animProgress * n - i))
          const endAngle = currentAngle + sliceAngle * sp
          const outerStartX = centerX + outerRadius * Math.cos(currentAngle)
          const outerStartY = centerY + outerRadius * Math.sin(currentAngle)
          const outerEndX = centerX + outerRadius * Math.cos(endAngle)
          const outerEndY = centerY + outerRadius * Math.sin(endAngle)
          const innerStartX = centerX + innerRadius * Math.cos(currentAngle)
          const innerStartY = centerY + innerRadius * Math.sin(currentAngle)
          const innerEndX = centerX + innerRadius * Math.cos(endAngle)
          const innerEndY = centerY + innerRadius * Math.sin(endAngle)
          const largeArc = sliceAngle * sp > Math.PI ? 1 : 0
          const pathData = sp > 0.001
            ? `M ${outerStartX} ${outerStartY} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY} L ${innerEndX} ${innerEndY} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY} Z`
            : ''
          currentAngle += sliceAngle
          return pathData ? (
            <Path key={i} data={pathData} fill={dataset.color} opacity={1 - i * 0.15} />
          ) : null
        })}
      </>
    )
  }

  return (
    <Group {...konvaProps}>
      <Rect
        x={0} y={0} width={w} height={h}
        fill={backgroundColor}
        cornerRadius={el.cornerRadius ?? 4}
      />

      {showGrid && chartType !== 'pie' && chartType !== 'doughnut' && (
        <Group>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <Line
              key={i}
              points={[padding, padding + chartH * ratio, padding + chartW, padding + chartH * ratio]}
              stroke="#333"
              strokeWidth={1}
              dash={[4, 4]}
            />
          ))}
        </Group>
      )}

      {chartType === 'bar'      && renderBarChart()}
      {chartType === 'line'     && renderLineChart()}
      {chartType === 'pie'      && renderPieChart()}
      {chartType === 'doughnut' && renderDoughnutChart()}
      {chartType === 'area'     && renderAreaChart()}

      {showLegend && (
        <Group y={h - 22}>
          {data.datasets.map((dataset, i) => (
            <Group key={i} x={padding + i * 90}>
              <Rect x={0} y={1} width={10} height={10} fill={dataset.color} cornerRadius={2} />
              <Text x={14} y={0} text={dataset.label} fontSize={labelFontSize} fontFamily={fontFamily} fill={labelColor} />
            </Group>
          ))}
        </Group>
      )}
    </Group>
  )
}
