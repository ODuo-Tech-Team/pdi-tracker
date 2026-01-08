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
  GoalAction,
  ACTION_STATUS_LABELS,
  ACTION_STATUS_COLORS,
} from '@/types/database'

// Simple type for user selection
interface SimpleUser {
  id: string
  name: string
  avatar_url: string | null
}
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus,
  ClipboardList,
  Calendar,
  User,
  DollarSign,
  MapPin,
  HelpCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  XCircle,
  Trash2,
  Edit2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionsSectionProps {
  goalId: string
  isOwner: boolean
}

export function ActionsSection({ goalId, isOwner }: ActionsSectionProps) {
  const router = useRouter()
  const supabase = createClient()

  const [actions, setActions] = useState<(GoalAction & { assigned_user?: SimpleUser })[]>([])
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingAction, setEditingAction] = useState<GoalAction | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    what: '',
    why: '',
    where_location: '',
    when_date: '',
    who: '',
    how: '',
    how_much: '',
  })

  useEffect(() => {
    fetchActions()
    fetchUsers()
  }, [goalId])

  const fetchActions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('goal_actions')
        .select(`
          *,
          assigned_user:profiles!goal_actions_who_fkey(*)
        `)
        .eq('goal_id', goalId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setActions(data || [])
    } catch (error) {
      console.error('Error fetching actions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .order('name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.what.trim()) {
      toast.error('O campo "O que?" e obrigatorio')
      return
    }

    setSubmitting(true)

    try {
      const { data: userData } = await supabase.auth.getUser()

      const actionData = {
        what: formData.what.trim(),
        why: formData.why.trim() || null,
        where_location: formData.where_location.trim() || null,
        when_date: formData.when_date || null,
        who: formData.who || null,
        how: formData.how.trim() || null,
        how_much: formData.how_much ? parseFloat(formData.how_much) : null,
      }

      if (editingAction) {
        const { error } = await supabase
          .from('goal_actions')
          .update(actionData)
          .eq('id', editingAction.id)

        if (error) throw error
        toast.success('Acao atualizada!')
      } else {
        const { error } = await supabase
          .from('goal_actions')
          .insert({
            ...actionData,
            goal_id: goalId,
            created_by: userData.user?.id,
          })

        if (error) throw error
        toast.success('Acao criada!')
      }

      resetForm()
      fetchActions()
      router.refresh()
    } catch (error) {
      console.error('Error saving action:', error)
      toast.error('Erro ao salvar acao')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      what: '',
      why: '',
      where_location: '',
      when_date: '',
      who: '',
      how: '',
      how_much: '',
    })
    setShowForm(false)
    setEditingAction(null)
  }

  const handleEdit = (action: GoalAction) => {
    setEditingAction(action)
    setFormData({
      what: action.what,
      why: action.why || '',
      where_location: action.where_location || '',
      when_date: action.when_date || '',
      who: action.who || '',
      how: action.how || '',
      how_much: action.how_much?.toString() || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (actionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta acao?')) return

    try {
      const { error } = await supabase
        .from('goal_actions')
        .delete()
        .eq('id', actionId)

      if (error) throw error
      toast.success('Acao excluida')
      fetchActions()
    } catch (error) {
      console.error('Error deleting action:', error)
      toast.error('Erro ao excluir')
    }
  }

  const handleStatusChange = async (actionId: string, newStatus: GoalAction['status']) => {
    try {
      const updateData: Partial<GoalAction> = { status: newStatus }
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('goal_actions')
        .update(updateData)
        .eq('id', actionId)

      if (error) throw error
      toast.success('Status atualizado')
      fetchActions()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar')
    }
  }

  const StatusIcon = ({ status }: { status: GoalAction['status'] }) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" style={{ color: ACTION_STATUS_COLORS.completed }} />
      case 'in_progress': return <PlayCircle className="h-4 w-4" style={{ color: ACTION_STATUS_COLORS.in_progress }} />
      case 'cancelled': return <XCircle className="h-4 w-4" style={{ color: ACTION_STATUS_COLORS.cancelled }} />
      default: return <Clock className="h-4 w-4" style={{ color: ACTION_STATUS_COLORS.pending }} />
    }
  }

  const completedCount = actions.filter(a => a.status === 'completed').length
  const totalCount = actions.length

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando acoes...
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Plano de Acao (5W2H)</span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {completedCount}/{totalCount}
            </Badge>
          )}
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>

      {isExpanded && (
        <div className="space-y-2 pl-6">
          {/* Actions List */}
          {actions.length > 0 ? (
            <div className="space-y-2">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className={cn(
                    'p-3 rounded-lg border text-sm',
                    action.status === 'completed' && 'bg-green-50 border-green-200',
                    action.status === 'cancelled' && 'bg-gray-50 border-gray-200 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      {/* What */}
                      <div className="flex items-start gap-2">
                        <StatusIcon status={action.status} />
                        <span className={cn(
                          'font-medium',
                          action.status === 'completed' && 'line-through text-muted-foreground'
                        )}>
                          {action.what}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground pl-6">
                        {action.why && (
                          <div className="flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" />
                            <span>Por que: {action.why}</span>
                          </div>
                        )}
                        {action.where_location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>Onde: {action.where_location}</span>
                          </div>
                        )}
                        {action.when_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Quando: {format(new Date(action.when_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        )}
                        {action.assigned_user && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Quem: {action.assigned_user.name}</span>
                          </div>
                        )}
                        {action.how && (
                          <div className="flex items-center gap-1 col-span-2">
                            <span>Como: {action.how}</span>
                          </div>
                        )}
                        {action.how_much && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>
                              Quanto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(action.how_much)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {isOwner && action.status !== 'cancelled' && (
                      <div className="flex items-center gap-1">
                        {action.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleStatusChange(action.id, 'in_progress')}
                            title="Iniciar"
                          >
                            <PlayCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {action.status === 'in_progress' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleStatusChange(action.id, 'completed')}
                            title="Concluir"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(action)}
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600"
                          onClick={() => handleDelete(action.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhuma acao definida
            </p>
          )}

          {/* Add Action Button */}
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar Acao
            </Button>
          )}
        </div>
      )}

      {/* Action Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingAction ? 'Editar Acao' : 'Nova Acao'} (5W2H)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* What - Required */}
              <div className="space-y-2">
                <Label htmlFor="action-what" className="flex items-center gap-1">
                  <span className="text-red-500">*</span> O que? (What)
                </Label>
                <Input
                  id="action-what"
                  value={formData.what}
                  onChange={(e) => setFormData({ ...formData, what: e.target.value })}
                  placeholder="Qual acao sera realizada?"
                />
              </div>

              {/* Why */}
              <div className="space-y-2">
                <Label htmlFor="action-why">Por que? (Why)</Label>
                <Textarea
                  id="action-why"
                  value={formData.why}
                  onChange={(e) => setFormData({ ...formData, why: e.target.value })}
                  placeholder="Justificativa da acao..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Where */}
                <div className="space-y-2">
                  <Label htmlFor="action-where">Onde? (Where)</Label>
                  <Input
                    id="action-where"
                    value={formData.where_location}
                    onChange={(e) => setFormData({ ...formData, where_location: e.target.value })}
                    placeholder="Local"
                  />
                </div>

                {/* When */}
                <div className="space-y-2">
                  <Label htmlFor="action-when">Quando? (When)</Label>
                  <Input
                    id="action-when"
                    type="date"
                    value={formData.when_date}
                    onChange={(e) => setFormData({ ...formData, when_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Who */}
              <div className="space-y-2">
                <Label>Quem? (Who)</Label>
                <Select
                  value={formData.who || '_none_'}
                  onValueChange={(v) => setFormData({ ...formData, who: v === '_none_' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsavel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">Ninguem atribuido</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* How */}
              <div className="space-y-2">
                <Label htmlFor="action-how">Como? (How)</Label>
                <Textarea
                  id="action-how"
                  value={formData.how}
                  onChange={(e) => setFormData({ ...formData, how: e.target.value })}
                  placeholder="Como sera executada a acao?"
                  rows={2}
                />
              </div>

              {/* How Much */}
              <div className="space-y-2">
                <Label htmlFor="action-how-much">Quanto custa? (How Much)</Label>
                <Input
                  id="action-how-much"
                  type="number"
                  step="0.01"
                  value={formData.how_much}
                  onChange={(e) => setFormData({ ...formData, how_much: e.target.value })}
                  placeholder="Custo estimado (R$)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#F58300] hover:bg-[#e07600]">
                {submitting ? 'Salvando...' : editingAction ? 'Atualizar' : 'Criar Acao'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
