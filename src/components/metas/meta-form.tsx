'use client'

import { useState } from 'react'
import { Goal, GoalCategory, GoalPriority, GoalStatus, CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MetaFormProps {
  goal?: Goal | null
  onSuccess: (goal: Goal, isNew: boolean) => void
  onCancel: () => void
}

export function MetaForm({ goal, onSuccess, onCancel }: MetaFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    category: goal?.category || 'profissional' as GoalCategory,
    priority: goal?.priority || 'medium' as GoalPriority,
    status: goal?.status || 'not_started' as GoalStatus,
    due_date: goal?.due_date || '',
    progress: goal?.progress || 0,
  })

  const supabase = createClient()
  const router = useRouter()
  const isEditing = !!goal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Usuário não autenticado')
      setLoading(false)
      return
    }

    const goalData = {
      ...formData,
      user_id: user.id,
      due_date: formData.due_date || null,
    }

    if (isEditing) {
      const { data, error } = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', goal.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating goal:', error)
        toast.error(`Erro ao atualizar meta: ${error.message}`)
        setLoading(false)
        return
      }

      toast.success('Meta atualizada!')
      onSuccess(data, false)
    } else {
      const { data, error } = await supabase
        .from('goals')
        .insert(goalData)
        .select()
        .single()

      if (error) {
        console.error('Error creating goal:', error)
        toast.error(`Erro ao criar meta: ${error.message}`)
        setLoading(false)
        return
      }

      toast.success('Meta criada!')
      onSuccess(data, true)
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Concluir curso de liderança"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva os detalhes e indicadores de sucesso..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as GoalCategory })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value as GoalPriority })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as GoalStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Prazo</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Progresso</Label>
          <span className="text-sm font-medium text-[#F58300]">{formData.progress}%</span>
        </div>
        <Slider
          value={[formData.progress]}
          onValueChange={([value]) => setFormData({ ...formData, progress: value })}
          max={100}
          step={5}
          className="py-2"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#F58300] hover:bg-[#e07600]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Salvando...' : 'Criando...'}
            </>
          ) : (
            isEditing ? 'Salvar' : 'Criar Meta'
          )}
        </Button>
      </div>
    </form>
  )
}
