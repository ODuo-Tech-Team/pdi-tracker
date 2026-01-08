'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  KPIWithValues,
  KPIMetricType,
  AREA_LABELS,
  AREA_COLORS,
  AreaType,
  KPI_FREQUENCY_LABELS,
  KPIFrequency,
} from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Calendar,
  Plus,
  History,
  BarChart3,
  Info,
  Flag,
  Edit2,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { KPISparkline, VariationBadge } from './kpi-sparkline'
import { GoalsSection } from './goals-section'

interface KPIDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kpi: KPIWithValues
  isOwner: boolean
  onEdit?: () => void
  onDelete?: () => void
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

export function KPIDetailModal({ open, onOpenChange, kpi, isOwner, onEdit, onDelete }: KPIDetailModalProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const metricType = kpi.metric_type as KPIMetricType
  const trend = getTrend(kpi.values)
  const previousValue = kpi.values.length >= 2 ? kpi.values[1].value : null

  // Calculate statistics
  const stats = useMemo(() => {
    if (kpi.values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 }
    }
    const values = kpi.values.map(v => v.value)
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }
  }, [kpi.values])

  // Sparkline values for larger chart
  const chartValues = kpi.values
    .slice(0, 20)
    .map(v => v.value)
    .reverse()

  // Progress to target
  const progressPercent = kpi.target_value
    ? Math.min((kpi.current_value / kpi.target_value) * 100, 100)
    : 0

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newValue.trim()) {
      toast.error('Digite um valor')
      return
    }

    const numValue = parseFloat(newValue)
    if (isNaN(numValue)) {
      toast.error('Valor invalido')
      return
    }

    setLoading(true)

    try {
      const { error: valueError } = await supabase
        .from('kpi_values')
        .insert({
          kpi_id: kpi.id,
          value: numValue,
          recorded_at: new Date().toISOString(),
        })

      if (valueError) throw valueError

      const { error: kpiError } = await supabase
        .from('kpis')
        .update({ current_value: numValue })
        .eq('id', kpi.id)

      if (kpiError) throw kpiError

      toast.success('Valor registrado!')
      setNewValue('')
      router.refresh()
    } catch (error) {
      console.error('Error recording value:', error)
      toast.error('Erro ao registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
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
              <DialogTitle className="text-xl">{kpi.title}</DialogTitle>
              {kpi.description && (
                <p className="text-sm text-muted-foreground mt-1">{kpi.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <TrendIcon className={cn('h-5 w-5', trendColor)} />
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar KPI
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir KPI
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Main Value Display */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor Atual</p>
              <div className="text-4xl font-bold tracking-tight">
                {formatValue(kpi.current_value, metricType, kpi.unit)}
              </div>
              {previousValue !== null && (
                <div className="mt-1">
                  <VariationBadge
                    currentValue={kpi.current_value}
                    previousValue={previousValue}
                    format="percentage"
                  />
                </div>
              )}
            </div>

            {kpi.target_value && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Meta</p>
                <div className="text-2xl font-semibold text-muted-foreground">
                  {formatValue(kpi.target_value, metricType, kpi.unit)}
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={cn(
                    'font-medium',
                    progressPercent >= 80 ? 'text-green-600' :
                    progressPercent >= 50 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {progressPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Grafico
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5">
              <Flag className="h-4 w-4" />
              Metas
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-4 w-4" />
              Historico
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-1.5">
              <Info className="h-4 w-4" />
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Chart */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3">Evolucao</h4>
              {chartValues.length >= 2 ? (
                <div className="flex justify-center">
                  <KPISparkline
                    values={chartValues}
                    width={500}
                    height={120}
                    showArea={true}
                  />
                </div>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-muted-foreground">
                  Dados insuficientes para exibir grafico
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Media</p>
                <p className="text-lg font-semibold">{formatValue(stats.avg, metricType, kpi.unit)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Minimo</p>
                <p className="text-lg font-semibold">{formatValue(stats.min, metricType, kpi.unit)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Maximo</p>
                <p className="text-lg font-semibold">{formatValue(stats.max, metricType, kpi.unit)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Registros</p>
                <p className="text-lg font-semibold">{stats.count}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="mt-4">
            <GoalsSection
              kpiId={kpi.id}
              kpiCurrentValue={kpi.current_value}
              metricType={metricType}
              unit={kpi.unit}
              isOwner={isOwner}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {kpi.values.length > 0 ? (
                kpi.values.map((value, index) => (
                  <div
                    key={value.id || index}
                    className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(value.recorded_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {formatValue(value.value, metricType, kpi.unit)}
                      </span>
                      {index < kpi.values.length - 1 && (
                        <span className={cn(
                          'text-xs',
                          value.value > kpi.values[index + 1].value ? 'text-green-600' :
                          value.value < kpi.values[index + 1].value ? 'text-red-600' : 'text-muted-foreground'
                        )}>
                          {value.value > kpi.values[index + 1].value ? '↑' :
                           value.value < kpi.values[index + 1].value ? '↓' : '–'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Frequencia</span>
                <span className="font-medium">{KPI_FREQUENCY_LABELS[kpi.frequency as KPIFrequency]}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Tipo de Metrica</span>
                <Badge variant="outline">{metricType}</Badge>
              </div>
              {kpi.unit && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Unidade</span>
                  <span className="font-medium">{kpi.unit}</span>
                </div>
              )}
              {kpi.owner && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Responsavel</span>
                  <span className="font-medium">{kpi.owner.name}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Criado em</span>
                <span className="font-medium">
                  {format(new Date(kpi.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Add Form */}
        {isOwner && (
          <div className="border-t pt-4 mt-4">
            <form onSubmit={handleQuickAdd} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="quick-value" className="sr-only">Novo valor</Label>
                <Input
                  id="quick-value"
                  type="number"
                  step="any"
                  placeholder="Digite o novo valor..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="bg-[#F58300] hover:bg-[#e07600]">
                <Plus className="h-4 w-4 mr-1" />
                {loading ? 'Salvando...' : 'Registrar'}
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
