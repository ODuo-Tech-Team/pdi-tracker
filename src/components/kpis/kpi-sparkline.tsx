'use client'

import { useMemo } from 'react'

interface KPISparklineProps {
  values: number[]
  width?: number
  height?: number
  color?: string
  showArea?: boolean
}

export function KPISparkline({
  values,
  width = 80,
  height = 30,
  color = '#3B82F6',
  showArea = true,
}: KPISparklineProps) {
  const pathData = useMemo(() => {
    if (values.length < 2) return { linePath: '', areaPath: '' }

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const padding = 2

    const points = values.map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - padding * 2)
      const y = padding + (1 - (value - min) / range) * (height - padding * 2)
      return { x, y }
    })

    const linePath = points
      .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(' ')

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

    return { linePath, areaPath }
  }, [values, width, height])

  if (values.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-xs text-muted-foreground"
      >
        --
      </div>
    )
  }

  const isPositive = values[values.length - 1] >= values[0]
  const strokeColor = color || (isPositive ? '#22C55E' : '#EF4444')

  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <path
          d={pathData.areaPath}
          fill={strokeColor}
          fillOpacity={0.1}
        />
      )}
      <path
        d={pathData.linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End point dot */}
      <circle
        cx={2 + ((values.length - 1) / (values.length - 1)) * (width - 4)}
        cy={
          2 +
          (1 - (values[values.length - 1] - Math.min(...values)) / (Math.max(...values) - Math.min(...values) || 1)) *
            (height - 4)
        }
        r={2.5}
        fill={strokeColor}
      />
    </svg>
  )
}

// Variation badge component
interface VariationBadgeProps {
  currentValue: number
  previousValue: number
  format?: 'percentage' | 'absolute'
}

export function VariationBadge({ currentValue, previousValue, format = 'percentage' }: VariationBadgeProps) {
  const diff = currentValue - previousValue
  const percentChange = previousValue !== 0 ? ((diff / previousValue) * 100) : 0
  const isPositive = diff >= 0

  const displayValue = format === 'percentage'
    ? `${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`
    : `${isPositive ? '+' : ''}${diff.toLocaleString('pt-BR')}`

  return (
    <span
      className={`inline-flex items-center text-xs font-medium ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {isPositive ? '↑' : '↓'} {displayValue}
    </span>
  )
}
