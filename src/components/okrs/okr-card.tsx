'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ObjectiveWithKRs,
  OKR_STATUS_LABELS,
  AREA_LABELS,
  AREA_COLORS,
  AreaType,
  OKRStatus,
} from '@/types/database'
import { ChevronRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OKRCardProps {
  objective: ObjectiveWithKRs
  showArea?: boolean
  showDetails?: boolean
}

const statusColors: Record<OKRStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_validation: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  tracking: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
}

type TrafficLightStatus = 'on-track' | 'at-risk' | 'off-track'

function getScoreColor(score: number): string {
  if (score >= 7) return 'text-green-600'
  if (score >= 4) return 'text-yellow-600'
  return 'text-red-600'
}

function getTrafficLightStatus(score: number): TrafficLightStatus {
  if (score >= 7) return 'on-track'
  if (score >= 4) return 'at-risk'
  return 'off-track'
}

function getTrafficLightColor(status: TrafficLightStatus): string {
  switch (status) {
    case 'on-track': return '#22C55E'
    case 'at-risk': return '#EAB308'
    case 'off-track': return '#EF4444'
  }
}

function getTrafficLightLabel(status: TrafficLightStatus): string {
  switch (status) {
    case 'on-track': return 'No caminho'
    case 'at-risk': return 'Em risco'
    case 'off-track': return 'Fora do caminho'
  }
}

export function OKRCard({ objective, showArea, showDetails }: OKRCardProps) {
  const keyResults = objective.key_results || []
  const progressPercent = objective.current_score * 10
  const trafficStatus = getTrafficLightStatus(objective.current_score)
  const trafficColor = getTrafficLightColor(trafficStatus)

  return (
    <Link href={`/dashboard/okrs/${objective.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {/* Traffic Light Indicator */}
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${trafficColor}20`,
                    color: trafficColor,
                  }}
                  title={getTrafficLightLabel(trafficStatus)}
                >
                  <Circle
                    className="h-2.5 w-2.5"
                    style={{ fill: trafficColor, color: trafficColor }}
                  />
                  {getTrafficLightLabel(trafficStatus)}
                </div>
                {showArea && objective.area && (
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: AREA_COLORS[objective.area as AreaType],
                      color: AREA_COLORS[objective.area as AreaType],
                    }}
                  >
                    {AREA_LABELS[objective.area as AreaType]}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base font-semibold line-clamp-2">
                {objective.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-2xl font-bold', getScoreColor(objective.current_score))}>
                {objective.current_score.toFixed(1)}
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {objective.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {objective.description}
            </p>
          )}

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progressPercent.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {showDetails && (
            <Badge variant="secondary" className={statusColors[objective.status]}>
              {OKR_STATUS_LABELS[objective.status]}
            </Badge>
          )}

          {/* Key Results Preview */}
          {keyResults.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">
                Key Results ({keyResults.length})
              </p>
              {keyResults.slice(0, showDetails ? 3 : 2).map((kr) => (
                <div key={kr.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 pr-2">{kr.title}</span>
                  <span className={cn('font-medium', getScoreColor(kr.current_score))}>
                    {kr.current_score.toFixed(1)}
                  </span>
                </div>
              ))}
              {keyResults.length > (showDetails ? 3 : 2) && (
                <p className="text-xs text-muted-foreground">
                  +{keyResults.length - (showDetails ? 3 : 2)} mais
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
