'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  OKRTask,
  OKRTaskWithAssignee,
  OKRTaskPriority,
  OKR_TASK_PRIORITY_LABELS,
  OKR_TASK_PRIORITY_COLORS,
} from '@/types/database'

interface SimpleUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
}
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus,
  ListTodo,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Loader2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Flag,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OKRTasksSectionProps {
  objectiveId?: string
  keyResultId?: string
  onProgressUpdate?: (progress: number) => void
}

export function OKRTasksSection({ objectiveId, keyResultId, onProgressUpdate }: OKRTasksSectionProps) {
  const router = useRouter()
  const supabase = createClient()

  const [tasks, setTasks] = useState<OKRTaskWithAssignee[]>([])
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingTask, setEditingTask] = useState<OKRTask | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as OKRTaskPriority,
    assignee_id: '',
    due_date: '',
  })

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [objectiveId, keyResultId])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchTasks = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('okr_tasks')
        .select(`
          *,
          assignee:profiles!okr_tasks_assignee_id_fkey(id, name, email, avatar_url),
          completed_by_user:profiles!okr_tasks_completed_by_fkey(id, name)
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (objectiveId) {
        query = query.eq('objective_id', objectiveId)
      }
      if (keyResultId) {
        query = query.eq('key_result_id', keyResultId)
      }

      const { data, error } = await query

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
        priority: formData.priority,
        assignee_id: formData.assignee_id || null,
        due_date: formData.due_date || null,
      }

      if (editingTask) {
        const { error } = await supabase
          .from('okr_tasks')
          .update(taskData)
          .eq('id', editingTask.id)

        if (error) throw error
        toast.success('Tarefa atualizada!')
      } else {
        const { error } = await supabase
          .from('okr_tasks')
          .insert({
            ...taskData,
            objective_id: objectiveId || null,
            key_result_id: keyResultId || null,
            created_by: userData.user?.id,
          })

        if (error) throw error
        toast.success('Tarefa criada!')
      }

      resetForm()
      fetchTasks()
      router.refresh()
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('Erro ao salvar tarefa')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assignee_id: '',
      due_date: '',
    })
    setShowForm(false)
    setEditingTask(null)
  }

  const handleEdit = (task: OKRTask) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignee_id: task.assignee_id || '',
      due_date: task.due_date || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

    try {
      const { error } = await supabase
        .from('okr_tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      toast.success('Tarefa excluida')
      fetchTasks()
      router.refresh()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Erro ao excluir')
    }
  }

  const handleToggleComplete = async (task: OKRTaskWithAssignee) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const newCompleted = !task.is_completed

      const { error } = await supabase
        .from('okr_tasks')
        .update({
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
          completed_by: newCompleted ? userData.user?.id : null,
        })
        .eq('id', task.id)

      if (error) throw error
      toast.success(newCompleted ? 'Tarefa concluida!' : 'Tarefa reaberta')

      fetchTasks()
      router.refresh()
    } catch (error) {
      console.error('Error toggling task:', error)
      toast.error('Erro ao atualizar')
    }
  }

  // Calculate progress
  const completedCount = tasks.filter(t => t.is_completed).length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  useEffect(() => {
    if (onProgressUpdate && totalCount > 0) {
      onProgressUpdate(progress)
    }
  }, [progress, totalCount, onProgressUpdate])

  const getPriorityIcon = (priority: OKRTaskPriority) => {
    return <Flag className="h-3 w-3" style={{ color: OKR_TASK_PRIORITY_COLORS[priority] }} />
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="text-lg text-[#043F8D] flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Tarefas ({completedCount}/{totalCount})
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
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                        task.is_completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(task)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {task.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            'font-medium',
                            task.is_completed && 'line-through text-gray-500'
                          )}>
                            {task.title}
                          </span>
                          <Badge variant="outline" className="text-xs gap-1">
                            {getPriorityIcon(task.priority)}
                            {OKR_TASK_PRIORITY_LABELS[task.priority]}
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}

                        {/* Meta info */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {task.assignee && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              {task.assignee.name}
                            </div>
                          )}
                          {task.due_date && (
                            <div className={cn(
                              'flex items-center gap-1 text-xs',
                              isOverdue(task.due_date) && !task.is_completed
                                ? 'text-red-600'
                                : 'text-gray-500'
                            )}>
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          )}
                          {task.is_completed && task.completed_by_user && (
                            <span className="text-xs text-gray-400">
                              Concluido por {task.completed_by_user.name}
                            </span>
                          )}
                        </div>
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
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma tarefa definida. Adicione tarefas para acompanhar o progresso deste OKR.
                </p>
              )}

              {/* Add Task Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tarefa
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
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
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
                  placeholder="Ex: Definir metricas de acompanhamento"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="task-description">Descricao (opcional)</Label>
                <Textarea
                  id="task-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes adicionais..."
                  rows={3}
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v: OKRTaskPriority) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OKR_TASK_PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Flag className="h-3 w-3" style={{ color: OKR_TASK_PRIORITY_COLORS[key as OKRTaskPriority] }} />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div className="space-y-2">
                <Label>Responsavel (opcional)</Label>
                <Select
                  value={formData.assignee_id}
                  onValueChange={(v) => setFormData({ ...formData, assignee_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Data limite (opcional)</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
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
