import { Group, Rect, Line, Text, Circle, Path } from 'react-konva'
import type { ChartElement } from '../../../types/editor'

interface Props {
  el: ChartElement
  konvaProps: Record<string, unknown>
}

export default function ChartKonva({ el, konvaProps }: Props) {
  const { data, chartType, showLegend, showGrid, backgroundColor } = el
  const w = el.width
  const h = el.height
  const padding = 36
  const labelFontSize = el.fontSize ?? 10
  const labelColor = el.textColor ?? '#999999'
  const chartW = w - padding * 2
  const chartH = h - padding * 2 - (showLegend ? 28 : 0)

  // Calculate max value for scaling
  const allValues = data.datasets.flatMap(ds => ds.data)
  const maxValue = Math.max(...allValues, 1)

  const renderBarChart = () => {
    const barWidth = chartW / (data.labels.length * data.datasets.length + data.labels.length)
    const groupWidth = barWidth * data.datasets.length
    const spacing = barWidth

    return (
      <>
        {data.labels.map((label, i) => (
          <Group key={i}>
            {data.datasets.map((dataset, j) => {
              const value = dataset.data[i]
              const barHeight = (value / maxValue) * chartH
              const x = padding + i * (groupWidth + spacing) + j * barWidth
              const y = padding + chartH - barHeight

              return (
                <Group key={j}>
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth * 0.9}
                    height={barHeight}
                    fill={dataset.color}
                  />
                </Group>
              )
            })}
            <Text
              x={padding + i * (groupWidth + spacing)}
              y={padding + chartH + 5}
              text={label}
              fontSize={labelFontSize}
              fill={labelColor}
              width={groupWidth}
              align="center"
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
          const points: number[] = []
          dataset.data.forEach((value, i) => {
            const x = padding + i * pointSpacing
            const y = padding + chartH - (value / maxValue) * chartH
            points.push(x, y)
          })

          return (
            <Group key={dsIndex}>
              <Line
                points={points}
                stroke={dataset.color}
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
              />
              {dataset.data.map((value, i) => (
                <Circle
                  key={i}
                  x={padding + i * pointSpacing}
                  y={padding + chartH - (value / maxValue) * chartH}
                  radius={4}
                  fill={dataset.color}
                />
              ))}
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
            fill={labelColor}
            width={40}
            align="center"
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
    const total = dataset.data.reduce((sum, val) => sum + val, 0)
    let currentAngle = -Math.PI / 2

    return (
      <>
        {dataset.data.map((value, i) => {
          const sliceAngle = (value / total) * 2 * Math.PI
          const endAngle = currentAngle + sliceAngle
          
          const startX = centerX + radius * Math.cos(currentAngle)
          const startY = centerY + radius * Math.sin(currentAngle)
          const endX = centerX + radius * Math.cos(endAngle)
          const endY = centerY + radius * Math.sin(endAngle)
          
          const largeArc = sliceAngle > Math.PI ? 1 : 0
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ')

          const slice = (
            <Path
              key={i}
              data={pathData}
              fill={dataset.color}
              opacity={1 - i * 0.15}
            />
          )

          currentAngle = endAngle
          return slice
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
    const total = dataset.data.reduce((sum, val) => sum + val, 0)
    let currentAngle = -Math.PI / 2

    return (
      <>
        {dataset.data.map((value, i) => {
          const sliceAngle = (value / total) * 2 * Math.PI
          const endAngle = currentAngle + sliceAngle
          
          const outerStartX = centerX + outerRadius * Math.cos(currentAngle)
          const outerStartY = centerY + outerRadius * Math.sin(currentAngle)
          const outerEndX = centerX + outerRadius * Math.cos(endAngle)
          const outerEndY = centerY + outerRadius * Math.sin(endAngle)
          
          const innerStartX = centerX + innerRadius * Math.cos(currentAngle)
          const innerStartY = centerY + innerRadius * Math.sin(currentAngle)
          const innerEndX = centerX + innerRadius * Math.cos(endAngle)
          const innerEndY = centerY + innerRadius * Math.sin(endAngle)
          
          const largeArc = sliceAngle > Math.PI ? 1 : 0
          
          const pathData = [
            `M ${outerStartX} ${outerStartY}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}`,
            `L ${innerEndX} ${innerEndY}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY}`,
            'Z'
          ].join(' ')

          const slice = (
            <Path
              key={i}
              data={pathData}
              fill={dataset.color}
              opacity={1 - i * 0.15}
            />
          )

          currentAngle = endAngle
          return slice
        })}
      </>
    )
  }

  const renderAreaChart = () => {
    const pointSpacing = chartW / (data.labels.length - 1 || 1)

    return (
      <>
        {data.datasets.map((dataset, dsIndex) => {
          const points: number[] = []
          dataset.data.forEach((value, i) => {
            const x = padding + i * pointSpacing
            const y = padding + chartH - (value / maxValue) * chartH
            points.push(x, y)
          })

          // Add bottom points to close the area
          const areaPoints = [
            ...points,
            padding + (data.labels.length - 1) * pointSpacing, padding + chartH,
            padding, padding + chartH
          ]

          return (
            <Group key={dsIndex}>
              <Line
                points={areaPoints}
                fill={dataset.color}
                opacity={0.3}
                closed
              />
              <Line
                points={points}
                stroke={dataset.color}
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
              />
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
            fill={labelColor}
            width={40}
            align="center"
          />
        ))}
      </>
    )
  }

  return (
    <Group {...konvaProps}>
      {/* Background */}
      <Rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill={backgroundColor}
        cornerRadius={el.cornerRadius ?? 4}
      />

      {/* Grid */}
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

      {/* Chart content */}
      {chartType === 'bar' && renderBarChart()}
      {chartType === 'line' && renderLineChart()}
      {chartType === 'pie' && renderPieChart()}
      {chartType === 'doughnut' && renderDoughnutChart()}
      {chartType === 'area' && renderAreaChart()}

      {/* Legend */}
      {showLegend && (
        <Group y={h - 22}>
          {data.datasets.map((dataset, i) => (
            <Group key={i} x={padding + i * 90}>
              <Rect x={0} y={1} width={10} height={10} fill={dataset.color} cornerRadius={2} />
              <Text x={14} y={0} text={dataset.label} fontSize={labelFontSize} fill={labelColor} />
            </Group>
          ))}
        </Group>
      )}
    </Group>
  )
}
