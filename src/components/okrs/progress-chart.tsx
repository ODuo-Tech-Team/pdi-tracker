'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ObjectiveWithKRs, AREA_LABELS, AREA_COLORS, AreaType } from '@/types/database'
import { TrendingUp, BarChart3 } from 'lucide-react'

interface ProgressChartProps {
  objectives: ObjectiveWithKRs[]
  title?: string
}

// Simple bar chart without external dependencies
function SimpleBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(1)}</span>
      </div>
      <div className="h-6 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

export function ProgressChart({ objectives, title = 'Progresso por Area' }: ProgressChartProps) {
  const areaStats = useMemo(() => {
    const stats: Record<string, { count: number; totalScore: number; avgScore: number }> = {}

    objectives.forEach((obj) => {
      const area = obj.area || 'sem_area'
      if (!stats[area]) {
        stats[area] = { count: 0, totalScore: 0, avgScore: 0 }
      }
      stats[area].count++
      stats[area].totalScore += obj.current_score
    })

    // Calculate averages
    Object.keys(stats).forEach((area) => {
      stats[area].avgScore = stats[area].totalScore / stats[area].count
    })

    return stats
  }, [objectives])

  const sortedAreas = Object.entries(areaStats)
    .filter(([area]) => area !== 'sem_area')
    .sort((a, b) => b[1].avgScore - a[1].avgScore)

  const maxScore = 10

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedAreas.length > 0 ? (
          sortedAreas.map(([area, stats]) => (
            <SimpleBar
              key={area}
              value={stats.avgScore}
              max={maxScore}
              color={AREA_COLORS[area as AreaType] || '#6B7280'}
              label={`${AREA_LABELS[area as AreaType] || area} (${stats.count})`}
            />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Nenhum dado disponivel
          </p>
        )}

        {/* Legend */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>Score Medio</span>
            <span>10</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Score distribution chart
export function ScoreDistributionChart({ objectives }: { objectives: ObjectiveWithKRs[] }) {
  const distribution = useMemo(() => {
    const onTrack = objectives.filter((o) => o.current_score >= 7).length
    const atRisk = objectives.filter((o) => o.current_score >= 4 && o.current_score < 7).length
    const offTrack = objectives.filter((o) => o.current_score < 4).length
    const total = objectives.length

    return {
      onTrack: { count: onTrack, percentage: total > 0 ? (onTrack / total) * 100 : 0 },
      atRisk: { count: atRisk, percentage: total > 0 ? (atRisk / total) * 100 : 0 },
      offTrack: { count: offTrack, percentage: total > 0 ? (offTrack / total) * 100 : 0 },
      total,
    }
  }, [objectives])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5" />
          Distribuicao de Scores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked bar */}
        <div className="h-8 rounded-full overflow-hidden flex">
          {distribution.onTrack.percentage > 0 && (
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${distribution.onTrack.percentage}%` }}
              title={`No caminho: ${distribution.onTrack.count}`}
            />
          )}
          {distribution.atRisk.percentage > 0 && (
            <div
              className="bg-yellow-500 transition-all duration-500"
              style={{ width: `${distribution.atRisk.percentage}%` }}
              title={`Em risco: ${distribution.atRisk.count}`}
            />
          )}
          {distribution.offTrack.percentage > 0 && (
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${distribution.offTrack.percentage}%` }}
              title={`Fora do caminho: ${distribution.offTrack.count}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">No caminho</span>
            </div>
            <p className="text-lg font-bold text-green-600">{distribution.onTrack.count}</p>
            <p className="text-xs text-muted-foreground">{distribution.onTrack.percentage.toFixed(0)}%</p>
          </div>
          <div className="p-2 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-muted-foreground">Em risco</span>
            </div>
            <p className="text-lg font-bold text-yellow-600">{distribution.atRisk.count}</p>
            <p className="text-xs text-muted-foreground">{distribution.atRisk.percentage.toFixed(0)}%</p>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">Fora</span>
            </div>
            <p className="text-lg font-bold text-red-600">{distribution.offTrack.count}</p>
            <p className="text-xs text-muted-foreground">{distribution.offTrack.percentage.toFixed(0)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
