'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  KPIWithValues,
  KPI_FREQUENCY_LABELS,
  KPI_METRIC_TYPE_LABELS,
  AREA_LABELS,
  AREA_COLORS,
  AreaType,
  KPIFrequency,
  KPIMetricType,
} from '@/types/database'
import { TrendingUp, TrendingDown, Minus, BarChart3, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPIValueDialog } from './kpi-value-dialog'

interface KPICardProps {
  kpi: KPIWithValues
  isOwner: boolean
}

function formatValue(value: number, metricType: KPIMetricType, unit?: string | null): string {
  if (metricType === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }
  if (metricType === 'percentage') {
    return `${value.toFixed(1)}%`
  }
  if (metricType === 'boolean') {
    return value >= 1 ? 'Sim' : 'Nao'
  }
  return `${value}${unit ? ` ${unit}` : ''}`
}

function getTrend(values: { value: number }[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'
  const latest = values[0].value
  const previous = values[1].value
  if (latest > previous) return 'up'
  if (latest < previous) return 'down'
  return 'stable'
}

function getProgressPercent(current: number, target: number | null): number {
  if (!target || target === 0) return 0
  const percent = (current / target) * 100
  return Math.min(percent, 100)
}

export function KPICard({ kpi, isOwner }: KPICardProps) {
  const [showValueDialog, setShowValueDialog] = useState(false)

  const trend = getTrend(kpi.values)
  const progressPercent = getProgressPercent(kpi.current_value, kpi.target_value)
  const metricType = kpi.metric_type as KPIMetricType

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'

  return (
    <>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {kpi.area && (
                <Badge
                  variant="outline"
                  className="mb-2"
                  style={{
                    borderColor: AREA_COLORS[kpi.area as AreaType],
                    color: AREA_COLORS[kpi.area as AreaType],
                  }}
                >
                  {AREA_LABELS[kpi.area as AreaType]}
                </Badge>
              )}
              <CardTitle className="text-base font-semibold line-clamp-2">
                {kpi.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <TrendIcon className={cn('h-4 w-4', trendColor)} />
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {kpi.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {kpi.description}
            </p>
          )}

          {/* Current Value */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Valor Atual</p>
              <p className="text-2xl font-bold">
                {formatValue(kpi.current_value, metricType, kpi.unit)}
              </p>
            </div>
            {kpi.target_value && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Meta</p>
                <p className="text-lg font-semibold text-muted-foreground">
                  {formatValue(kpi.target_value, metricType, kpi.unit)}
                </p>
              </div>
            )}
          </div>

          {/* Progress */}
          {kpi.target_value && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Badge variant="secondary" className="text-xs">
              {KPI_FREQUENCY_LABELS[kpi.frequency as KPIFrequency]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {KPI_METRIC_TYPE_LABELS[metricType]}
            </Badge>
          </div>

          {/* Mini Trend Chart - últimos valores */}
          {kpi.values.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Ultimos registros ({kpi.values.length})
              </p>
              <div className="flex items-end gap-1 h-8">
                {kpi.values.slice(0, 10).reverse().map((v, i) => {
                  const maxVal = Math.max(...kpi.values.slice(0, 10).map(x => x.value), 1)
                  const height = (v.value / maxVal) * 100
                  return (
                    <div
                      key={v.id || i}
                      className="flex-1 bg-primary/20 rounded-t"
                      style={{ height: `${Math.max(height, 10)}%` }}
                      title={formatValue(v.value, metricType, kpi.unit)}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => setShowValueDialog(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Registrar Valor
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Value Registration Dialog */}
      <KPIValueDialog
        open={showValueDialog}
        onOpenChange={setShowValueDialog}
        kpi={kpi}
      />
    </>
  )
}
