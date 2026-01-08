'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  KRCheckIn,
  ConfidenceLevel,
  CONFIDENCE_LABELS,
  CONFIDENCE_COLORS,
} from '@/types/database'
import {
  ChevronDown,
  ChevronUp,
  Circle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface CheckinTimelineProps {
  checkIns: KRCheckIn[]
  unit?: string | null
  maxInitialItems?: number
}

function getScoreColor(score: number): string {
  if (score >= 7) return 'text-green-600'
  if (score >= 4) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreBgColor(score: number): string {
  if (score >= 7) return 'bg-green-500'
  if (score >= 4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getValueTrend(current: number, previous: number | null): 'up' | 'down' | 'same' {
  if (previous === null) return 'same'
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'same'
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'same' }) {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-500" />
  return <Minus className="h-3 w-3 text-muted-foreground" />
}

export function CheckinTimeline({
  checkIns,
  unit,
  maxInitialItems = 3,
}: CheckinTimelineProps) {
  const [expanded, setExpanded] = useState(false)

  if (checkIns.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Nenhum check-in registrado ainda.
      </div>
    )
  }

  const displayedCheckIns = expanded
    ? checkIns
    : checkIns.slice(0, maxInitialItems)

  const hasMore = checkIns.length > maxInitialItems

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Historico de Check-ins ({checkIns.length})
        </p>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 text-xs"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Ver todos ({checkIns.length})
              </>
            )}
          </Button>
        )}
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-border" />

        {/* Check-in Items */}
        <div className="space-y-3">
          {displayedCheckIns.map((ci, index) => {
            const confidence = (ci.confidence || 'green') as ConfidenceLevel
            const trend = getValueTrend(ci.new_value, ci.previous_value)
            const isFirst = index === 0

            return (
              <div key={ci.id} className="relative pl-6">
                {/* Timeline Dot */}
                <div
                  className={cn(
                    'absolute left-0 top-2 h-4 w-4 rounded-full border-2 border-background',
                    getScoreBgColor(ci.score)
                  )}
                  title={`Score: ${ci.score.toFixed(1)}`}
                />

                {/* Content Card */}
                <div
                  className={cn(
                    'p-3 rounded-lg border transition-colors',
                    isFirst ? 'bg-muted/70 border-border' : 'bg-muted/30 border-transparent'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(ci.check_in_date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                      </span>
                      {isFirst && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          Mais recente
                        </span>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${CONFIDENCE_COLORS[confidence]}20`,
                        color: CONFIDENCE_COLORS[confidence],
                      }}
                    >
                      <Circle
                        className="h-2 w-2"
                        style={{ fill: CONFIDENCE_COLORS[confidence] }}
                      />
                      {CONFIDENCE_LABELS[confidence]}
                    </div>
                  </div>

                  {/* Values */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <TrendIcon trend={trend} />
                      <span className="font-medium">
                        {ci.previous_value !== null && (
                          <>
                            <span className="text-muted-foreground">
                              {ci.previous_value.toLocaleString('pt-BR')}
                            </span>
                            <span className="mx-1">→</span>
                          </>
                        )}
                        <span>{ci.new_value.toLocaleString('pt-BR')}</span>
                        {unit && <span className="text-muted-foreground ml-1">{unit}</span>}
                      </span>
                    </div>
                    <span className={cn('text-sm font-bold', getScoreColor(ci.score))}>
                      Score: {ci.score.toFixed(1)}
                    </span>
                  </div>

                  {/* Notes */}
                  {ci.notes && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {ci.notes}
                    </p>
                  )}

                  {/* Blockers */}
                  {ci.blockers && (
                    <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {ci.blockers}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary Stats */}
      {checkIns.length > 1 && (
        <div className="pt-3 border-t">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-muted/50 rounded">
              <p className="text-muted-foreground">Total Check-ins</p>
              <p className="font-bold text-lg">{checkIns.length}</p>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <p className="text-muted-foreground">Score Medio</p>
              <p className="font-bold text-lg">
                {(checkIns.reduce((acc, ci) => acc + ci.score, 0) / checkIns.length).toFixed(1)}
              </p>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <p className="text-muted-foreground">Ultimo Score</p>
              <p className={cn('font-bold text-lg', getScoreColor(checkIns[0]?.score || 0))}>
                {checkIns[0]?.score.toFixed(1) || '-'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
