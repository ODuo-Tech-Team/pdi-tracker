'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  KPIGoal,
  KPIGoalStatus,
  KPI_GOAL_STATUS_LABELS,
  KPI_GOAL_STATUS_COLORS,
  TARGET_OPERATOR_LABELS,
  KPIMetricType,
} from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus,
  Target,
  ChevronDown,
  ChevronRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionsSection } from './actions-section'

interface GoalsSectionProps {
  kpiId: string
  kpiCurrentValue: number
  metricType: KPIMetricType
  unit?: string | null
  isOwner: boolean
}

function formatValue(value: number, metricType: KPIMetricType, unit?: string | null): string {
  if (metricType === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }
  if (metricType === 'percentage') {
    return `${value.toFixed(1)}%`
  }
  return `${value.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}`
}

export function GoalsSection({ kpiId, kpiCurrentValue, metricType, unit, isOwner }: GoalsSectionProps) {
  const router = useRouter()
  const supabase = createClient()

  const [goals, setGoals] = useState<KPIGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [editingGoal, setEditingGoal] = useState<KPIGoal | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_operator: '>' as KPIGoal['target_operator'],
    target_value: '',
    deadline: '',
  })

  useEffect(() => {
    fetchGoals()
  }, [kpiId])

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('kpi_goals')
        .select('*')
        .eq('kpi_id', kpiId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGoals(data || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.target_value || !formData.deadline) {
      toast.error('Preencha todos os campos obrigatorios')
      return
    }

    setSubmitting(true)

    try {
      const { data: userData } = await supabase.auth.getUser()

      if (editingGoal) {
        const { error } = await supabase
          .from('kpi_goals')
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            target_operator: formData.target_operator,
            target_value: parseFloat(formData.target_value),
            deadline: formData.deadline,
          })
          .eq('id', editingGoal.id)

        if (error) throw error
        toast.success('Meta atualizada!')
      } else {
        const { error } = await supabase
          .from('kpi_goals')
          .insert({
            kpi_id: kpiId,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            target_operator: formData.target_operator,
            target_value: parseFloat(formData.target_value),
            deadline: formData.deadline,
            created_by: userData.user?.id,
          })

        if (error) throw error
        toast.success('Meta criada!')
      }

      resetForm()
      fetchGoals()
      router.refresh()
    } catch (error) {
      console.error('Error saving goal:', error)
      toast.error('Erro ao salvar meta')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      target_operator: '>',
      target_value: '',
      deadline: '',
    })
    setShowForm(false)
    setEditingGoal(null)
  }

  const handleEdit = (goal: KPIGoal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description || '',
      target_operator: goal.target_operator,
      target_value: goal.target_value.toString(),
      deadline: goal.deadline,
    })
    setShowForm(true)
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return

    try {
      const { error } = await supabase
        .from('kpi_goals')
        .delete()
        .eq('id', goalId)

      if (error) throw error
      toast.success('Meta excluida')
      fetchGoals()
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast.error('Erro ao excluir')
    }
  }

  const handleStatusChange = async (goalId: string, newStatus: KPIGoal['status']) => {
    try {
      const updateData: Partial<KPIGoal> = { status: newStatus }
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('kpi_goals')
        .update(updateData)
        .eq('id', goalId)

      if (error) throw error
      toast.success('Status atualizado')
      fetchGoals()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar')
    }
  }

  const toggleGoalExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals)
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId)
    } else {
      newExpanded.add(goalId)
    }
    setExpandedGoals(newExpanded)
  }

  const getProgressStatus = (goal: KPIGoal): { met: boolean; percent: number } => {
    const target = goal.target_value
    const current = kpiCurrentValue

    let met = false
    switch (goal.target_operator) {
      case '>': met = current > target; break
      case '>=': met = current >= target; break
      case '<': met = current < target; break
      case '<=': met = current <= target; break
      case '=': met = current === target; break
    }

    // Calculate percentage based on operator
    let percent = 0
    if (goal.target_operator === '>' || goal.target_operator === '>=') {
      percent = target > 0 ? Math.min((current / target) * 100, 150) : 0
    } else if (goal.target_operator === '<' || goal.target_operator === '<=') {
      percent = current > 0 ? Math.min((target / current) * 100, 150) : 100
    } else {
      percent = target === current ? 100 : Math.abs((1 - Math.abs(current - target) / Math.max(target, current)) * 100)
    }

    return { met, percent: Math.max(0, percent) }
  }

  const StatusIcon = ({ status }: { status: KPIGoal['status'] }) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status !== 'active')

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="font-medium">Metas</span>
          <Badge variant="secondary" className="ml-2">
            {activeGoals.length} ativa{activeGoals.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {isOpen && (
          <div className="px-4 pb-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Active Goals */}
                {activeGoals.length > 0 ? (
                  <div className="space-y-2">
                    {activeGoals.map((goal) => {
                      const progress = getProgressStatus(goal)
                      const isExpanded = expandedGoals.has(goal.id)

                      return (
                        <div key={goal.id} className="border rounded-lg overflow-hidden">
                          <div
                            className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleGoalExpanded(goal.id)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <StatusIcon status={goal.status} />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{goal.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {TARGET_OPERATOR_LABELS[goal.target_operator]} {formatValue(goal.target_value, metricType, unit)}
                                  {' · '}
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {format(new Date(goal.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={progress.met ? 'default' : 'secondary'}
                                className={cn(
                                  progress.met ? 'bg-green-600' : progress.percent >= 70 ? 'bg-yellow-600' : 'bg-red-600',
                                  'text-white'
                                )}
                              >
                                {progress.percent.toFixed(0)}%
                              </Badge>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-3 border-t space-y-3">
                              {goal.description && (
                                <p className="text-sm text-muted-foreground">{goal.description}</p>
                              )}

                              {/* Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Atual: {formatValue(kpiCurrentValue, metricType, unit)}</span>
                                  <span>Meta: {formatValue(goal.target_value, metricType, unit)}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all',
                                      progress.met ? 'bg-green-500' : progress.percent >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                    )}
                                    style={{ width: `${Math.min(progress.percent, 100)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Actions Section */}
                              <ActionsSection goalId={goal.id} isOwner={isOwner} />

                              {/* Goal Actions */}
                              {isOwner && (
                                <div className="flex items-center gap-2 pt-2 border-t">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleEdit(goal) }}
                                  >
                                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                                    Editar
                                  </Button>
                                  {progress.met && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-green-600"
                                      onClick={(e) => { e.stopPropagation(); handleStatusChange(goal.id, 'completed') }}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                      Marcar Concluida
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 ml-auto"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(goal.id) }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nenhuma meta ativa
                  </div>
                )}

                {/* Completed/Other Goals */}
                {completedGoals.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Metas concluidas/canceladas</p>
                    <div className="space-y-1">
                      {completedGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <StatusIcon status={goal.status} />
                            <span className="text-muted-foreground">{goal.title}</span>
                          </div>
                          <Badge variant="outline" style={{ color: KPI_GOAL_STATUS_COLORS[goal.status] }}>
                            {KPI_GOAL_STATUS_LABELS[goal.status]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Goal Button */}
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Meta
                  </Button>
                )}
              </>
            )}
          </div>
      )}

      {/* Goal Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="goal-title">Titulo *</Label>
                <Input
                  id="goal-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Aumentar faturamento em 20%"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-description">Descricao</Label>
                <Textarea
                  id="goal-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descricao adicional..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Operador *</Label>
                  <Select
                    value={formData.target_operator}
                    onValueChange={(v: KPIGoal['target_operator']) => setFormData({ ...formData, target_operator: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TARGET_OPERATOR_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal-target">Valor Meta *</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    step="any"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                    placeholder="Ex: 100000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-deadline">Prazo *</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="bg-muted/50 rounded p-3 text-sm">
                <p className="text-muted-foreground">
                  Valor atual do KPI: <strong>{formatValue(kpiCurrentValue, metricType, unit)}</strong>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#F58300] hover:bg-[#e07600]">
                {submitting ? 'Salvando...' : editingGoal ? 'Atualizar' : 'Criar Meta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
