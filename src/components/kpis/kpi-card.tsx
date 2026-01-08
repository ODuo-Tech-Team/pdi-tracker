'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  KPIWithValues,
  Profile,
  Objective,
  AREA_LABELS,
  AREA_COLORS,
  AreaType,
  KPIMetricType,
} from '@/types/database'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPISparkline, VariationBadge } from './kpi-sparkline'
import { KPIDetailModal } from './kpi-detail-modal'
import { KPIFormDialog } from './kpi-form'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface KPICardProps {
  kpi: KPIWithValues
  isOwner: boolean
  profile?: Profile | null
  objectives?: Pick<Objective, 'id' | 'title' | 'area'>[]
}

function formatValue(value: number, metricType: KPIMetricType, unit?: string | null, compact?: boolean): string {
  if (metricType === 'currency') {
    if (compact && value >= 1000) {
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value)
      return formatted
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }
  if (metricType === 'percentage') {
    return `${value.toFixed(1)}%`
  }
  if (metricType === 'boolean') {
    return value >= 1 ? 'Sim' : 'Nao'
  }
  if (compact && value >= 1000) {
    return `${(value / 1000).toFixed(1)}k${unit ? ` ${unit}` : ''}`
  }
  return `${value.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}`
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

export function KPICard({ kpi, isOwner, profile, objectives = [] }: KPICardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  const handleEdit = () => {
    setShowDetailModal(false)
    setShowEditForm(true)
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este KPI? Esta acao nao pode ser desfeita.')) {
      return
    }

    try {
      // First delete all related kpi_values
      const { error: valuesError } = await supabase
        .from('kpi_values')
        .delete()
        .eq('kpi_id', kpi.id)

      if (valuesError) throw valuesError

      // Then delete the KPI itself
      const { error } = await supabase
        .from('kpis')
        .delete()
        .eq('id', kpi.id)

      if (error) throw error

      toast.success('KPI excluido com sucesso')
      setShowDetailModal(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting KPI:', error)
      toast.error('Erro ao excluir KPI')
    }
  }

  const trend = getTrend(kpi.values)
  const progressPercent = getProgressPercent(kpi.current_value, kpi.target_value)
  const metricType = kpi.metric_type as KPIMetricType

  // Get sparkline values (reversed to show chronological order)
  const sparklineValues = kpi.values
    .slice(0, 12)
    .map(v => v.value)
    .reverse()

  // Get previous value for variation
  const previousValue = kpi.values.length >= 2 ? kpi.values[1].value : kpi.values[0]?.value || 0

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'

  // Determine status color based on progress
  const getStatusColor = () => {
    if (!kpi.target_value) return 'bg-muted'
    if (progressPercent >= 80) return 'bg-green-500'
    if (progressPercent >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <>
      <Card
        className="hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
        onClick={() => setShowDetailModal(true)}
      >
        {/* Status indicator bar */}
        <div className={cn('absolute top-0 left-0 right-0 h-1', getStatusColor())} />

        <CardContent className="pt-4 pb-3 px-4">
          {/* Header: Area + Trend */}
          <div className="flex items-center justify-between mb-2">
            {kpi.area ? (
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5"
                style={{
                  borderColor: AREA_COLORS[kpi.area as AreaType],
                  color: AREA_COLORS[kpi.area as AreaType],
                }}
              >
                {AREA_LABELS[kpi.area as AreaType]}
              </Badge>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-1">
              <TrendIcon className={cn('h-3.5 w-3.5', trendColor)} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-foreground line-clamp-1 mb-3 group-hover:text-primary transition-colors">
            {kpi.title}
          </h3>

          {/* Main Value Section */}
          <div className="flex items-end justify-between gap-2">
            <div className="flex-1">
              {/* Current Value - Large */}
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatValue(kpi.current_value, metricType, kpi.unit, true)}
              </div>

              {/* Variation Badge */}
              {kpi.values.length >= 2 && (
                <div className="mt-0.5">
                  <VariationBadge
                    currentValue={kpi.current_value}
                    previousValue={previousValue}
                    format="percentage"
                  />
                </div>
              )}
            </div>

            {/* Sparkline */}
            <div className="flex-shrink-0">
              {sparklineValues.length >= 2 ? (
                <KPISparkline
                  values={sparklineValues}
                  width={70}
                  height={28}
                  showArea={true}
                />
              ) : (
                <div className="w-[70px] h-[28px] flex items-center justify-center text-xs text-muted-foreground">
                  --
                </div>
              )}
            </div>
          </div>

          {/* Footer: Target + Records count */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            {kpi.target_value ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>Meta: {formatValue(kpi.target_value, metricType, kpi.unit, true)}</span>
              </div>
            ) : (
              <div />
            )}
            <span className="text-xs text-muted-foreground">
              {kpi.values.length} registro{kpi.values.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <KPIDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        kpi={kpi}
        isOwner={isOwner}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Form */}
      <KPIFormDialog
        open={showEditForm}
        onOpenChange={setShowEditForm}
        profile={profile || null}
        objectives={objectives}
        editingKPI={kpi}
      />
    </>
  )
}
