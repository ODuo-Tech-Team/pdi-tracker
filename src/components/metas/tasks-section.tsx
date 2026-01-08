'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  GoalTask,
  GoalTaskWithCompletions,
  TaskRecurrenceType,
  TASK_RECURRENCE_LABELS,
  WEEKDAY_INDEX_LABELS,
} from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus,
  ListTodo,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Loader2,
  Repeat,
  Calendar,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TasksSectionProps {
  goalId: string
  onProgressUpdate?: (progress: number) => void
}

export function TasksSection({ goalId, onProgressUpdate }: TasksSectionProps) {
  const router = useRouter()
  const supabase = createClient()

  const [tasks, setTasks] = useState<GoalTaskWithCompletions[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingTask, setEditingTask] = useState<GoalTask | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_recurring: false,
    recurrence_type: 'weekly' as TaskRecurrenceType,
    recurrence_days: [] as number[],
    weight: 1,
  })

  useEffect(() => {
    fetchTasks()
  }, [goalId])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('goal_tasks')
        .select(`
          *,
          completions:goal_task_completions(*)
        `)
        .eq('goal_id', goalId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Titulo e obrigatorio')
      return
    }

    setSubmitting(true)

    try {
      const { data: userData } = await supabase.auth.getUser()

      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
        recurrence_days: formData.is_recurring && formData.recurrence_days.length > 0
          ? formData.recurrence_days
          : null,
        weight: formData.weight,
      }

      if (editingTask) {
        const { error } = await supabase
          .from('goal_tasks')
          .update(taskData)
          .eq('id', editingTask.id)

        if (error) throw error
        toast.success('Atividade atualizada!')
      } else {
        const { error } = await supabase
          .from('goal_tasks')
          .insert({
            ...taskData,
            goal_id: goalId,
            created_by: userData.user?.id,
          })

        if (error) throw error
        toast.success('Atividade criada!')
      }

      resetForm()
      fetchTasks()
      router.refresh()
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('Erro ao salvar atividade')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      is_recurring: false,
      recurrence_type: 'weekly',
      recurrence_days: [],
      weight: 1,
    })
    setShowForm(false)
    setEditingTask(null)
  }

  const handleEdit = (task: GoalTask) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      is_recurring: task.is_recurring,
      recurrence_type: task.recurrence_type || 'weekly',
      recurrence_days: task.recurrence_days || [],
      weight: task.weight,
    })
    setShowForm(true)
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return

    try {
      const { error } = await supabase
        .from('goal_tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      toast.success('Atividade excluida')
      fetchTasks()
      router.refresh()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Erro ao excluir')
    }
  }

  const handleToggleComplete = async (task: GoalTaskWithCompletions) => {
    try {
      if (task.is_recurring) {
        // Para tarefas recorrentes, adiciona uma conclusao no historico
        const { data: userData } = await supabase.auth.getUser()

        const { error } = await supabase
          .from('goal_task_completions')
          .insert({
            task_id: task.id,
            created_by: userData.user?.id,
          })

        if (error) throw error
        toast.success('Atividade concluida!')
      } else {
        // Para tarefas simples, marca como completada
        const newCompleted = !task.is_completed
        const { error } = await supabase
          .from('goal_tasks')
          .update({
            is_completed: newCompleted,
            completed_at: newCompleted ? new Date().toISOString() : null,
          })
          .eq('id', task.id)

        if (error) throw error
        toast.success(newCompleted ? 'Atividade concluida!' : 'Atividade reaberta')
      }

      fetchTasks()
      router.refresh()
    } catch (error) {
      console.error('Error toggling task:', error)
      toast.error('Erro ao atualizar')
    }
  }

  const toggleRecurrenceDay = (day: number) => {
    const newDays = formData.recurrence_days.includes(day)
      ? formData.recurrence_days.filter(d => d !== day)
      : [...formData.recurrence_days, day].sort()
    setFormData({ ...formData, recurrence_days: newDays })
  }

  // Check if recurring task was completed in current period
  const isCompletedInPeriod = (task: GoalTaskWithCompletions): boolean => {
    if (!task.is_recurring || !task.completions?.length) return false

    const now = new Date()
    const latestCompletion = task.completions[0]?.completed_at

    if (!latestCompletion) return false

    const completionDate = parseISO(latestCompletion)

    switch (task.recurrence_type) {
      case 'daily':
        return isToday(completionDate)
      case 'weekly':
        return isWithinInterval(completionDate, {
          start: startOfWeek(now, { locale: ptBR }),
          end: endOfWeek(now, { locale: ptBR }),
        })
      case 'monthly':
        return isWithinInterval(completionDate, {
          start: startOfMonth(now),
          end: endOfMonth(now),
        })
      default:
        return false
    }
  }

  // Calculate progress
  const completedCount = tasks.filter(t => t.is_recurring ? isCompletedInPeriod(t) : t.is_completed).length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  useEffect(() => {
    if (onProgressUpdate && totalCount > 0) {
      onProgressUpdate(progress)
    }
  }, [progress, totalCount, onProgressUpdate])

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="text-lg text-[#043F8D] flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Atividades ({completedCount}/{totalCount})
          </CardTitle>
          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <Badge variant="secondary">
                {progress}%
              </Badge>
            )}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Tasks List */}
              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const isComplete = task.is_recurring
                      ? isCompletedInPeriod(task)
                      : task.is_completed

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                          isComplete ? 'bg-green-50 border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                        )}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(task)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {isComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'font-medium',
                              isComplete && 'line-through text-gray-500'
                            )}>
                              {task.title}
                            </span>
                            {task.is_recurring && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Repeat className="h-3 w-3" />
                                {TASK_RECURRENCE_LABELS[task.recurrence_type!]}
                              </Badge>
                            )}
                            {task.weight > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                Peso {task.weight}
                              </Badge>
                            )}
                          </div>

                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          )}

                          {/* Recurring info */}
                          {task.is_recurring && task.recurrence_days && task.recurrence_days.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {task.recurrence_type === 'weekly'
                                  ? task.recurrence_days.map(d => WEEKDAY_INDEX_LABELS[d]).join(', ')
                                  : `Dias: ${task.recurrence_days.join(', ')}`
                                }
                              </span>
                            </div>
                          )}

                          {/* Completion count for recurring */}
                          {task.is_recurring && task.completions && task.completions.length > 0 && (
                            <span className="text-xs text-gray-400 mt-1 block">
                              {task.completions.length} conclus{task.completions.length === 1 ? 'ao' : 'oes'}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(task)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma atividade definida. Adicione atividades para acompanhar seu progresso.
                </p>
              )}

              {/* Add Task Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Atividade
              </Button>
            </>
          )}
        </CardContent>
      )}

      {/* Task Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Editar Atividade' : 'Nova Atividade'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="task-title">Titulo *</Label>
                <Input
                  id="task-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Estudar 30 minutos"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="task-description">Descricao (opcional)</Label>
                <Input
                  id="task-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes adicionais..."
                />
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label>Peso (importancia para o progresso)</Label>
                <Select
                  value={formData.weight.toString()}
                  onValueChange={(v) => setFormData({ ...formData, weight: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((w) => (
                      <SelectItem key={w} value={w.toString()}>
                        {w} - {w === 1 ? 'Normal' : w <= 3 ? 'Importante' : 'Muito importante'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recurring Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_recurring: checked === true })
                  }
                />
                <Label htmlFor="is-recurring" className="flex items-center gap-1 cursor-pointer">
                  <Repeat className="h-4 w-4" />
                  Atividade recorrente
                </Label>
              </div>

              {/* Recurrence Settings */}
              {formData.is_recurring && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Frequencia</Label>
                    <Select
                      value={formData.recurrence_type}
                      onValueChange={(v: TaskRecurrenceType) =>
                        setFormData({ ...formData, recurrence_type: v, recurrence_days: [] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_RECURRENCE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weekday Selection for Weekly */}
                  {formData.recurrence_type === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Dias da semana</Label>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(WEEKDAY_INDEX_LABELS).map(([day, label]) => (
                          <button
                            key={day}
                            type="button"
                            className={cn(
                              'px-2 py-1 text-xs rounded border transition-colors',
                              formData.recurrence_days.includes(parseInt(day))
                                ? 'bg-[#043F8D] text-white border-[#043F8D]'
                                : 'bg-white hover:bg-gray-50'
                            )}
                            onClick={() => toggleRecurrenceDay(parseInt(day))}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    {formData.recurrence_type === 'daily' && 'Deve ser completada todos os dias'}
                    {formData.recurrence_type === 'weekly' && 'Deve ser completada uma vez por semana'}
                    {formData.recurrence_type === 'monthly' && 'Deve ser completada uma vez por mes'}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#F58300] hover:bg-[#e07600]">
                {submitting ? 'Salvando...' : editingTask ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
