'use client'

import { useState } from 'react'
import { Habit, HabitType, HABIT_TYPE_LABELS } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface HabitoFormProps {
  habit?: Habit | null
  onSuccess: (habit: Habit, isNew: boolean) => void
  onCancel: () => void
}

const WEEKDAYS = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
]

export function HabitoForm({ habit, onSuccess, onCancel }: HabitoFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: habit?.title || '',
    description: habit?.description || '',
    type: habit?.type || 'boolean' as HabitType,
    target_value: habit?.target_value || 1,
    frequency: habit?.frequency || ['seg', 'ter', 'qua', 'qui', 'sex'],
    is_active: habit?.is_active ?? true,
  })

  const supabase = createClient()
  const router = useRouter()
  const isEditing = !!habit

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      frequency: prev.frequency.includes(day)
        ? prev.frequency.filter(d => d !== day)
        : [...prev.frequency, day],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.frequency.length === 0) {
      toast.error('Selecione pelo menos um dia da semana')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Usuário não autenticado')
      setLoading(false)
      return
    }

    const habitData = {
      ...formData,
      user_id: user.id,
    }

    if (isEditing) {
      const { data, error } = await supabase
        .from('habits')
        .update(habitData)
        .eq('id', habit.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating habit:', error)
        toast.error(`Erro ao atualizar hábito: ${error.message}`)
        setLoading(false)
        return
      }

      toast.success('Hábito atualizado!')
      onSuccess(data, false)
    } else {
      const { data, error } = await supabase
        .from('habits')
        .insert(habitData)
        .select()
        .single()

      if (error) {
        console.error('Error creating habit:', error)
        toast.error(`Erro ao criar hábito: ${error.message}`)
        setLoading(false)
        return
      }

      toast.success('Hábito criado!')
      onSuccess(data, true)
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Nome do Hábito *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Treinar, Ler 30 min, Não fumar"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detalhes opcionais sobre o hábito..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as HabitType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(HABIT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.type !== 'boolean' && (
          <div className="space-y-2">
            <Label htmlFor="target_value">
              Meta Diária {formData.type === 'time' ? '(minutos)' : ''}
            </Label>
            <Input
              id="target_value"
              type="number"
              min={1}
              value={formData.target_value}
              onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 1 })}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Dias da Semana *</Label>
        <div className="flex gap-2">
          {WEEKDAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`w-10 h-10 rounded-full font-medium text-sm transition-colors ${
                formData.frequency.includes(day.value)
                  ? 'bg-[#043F8D] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {day.label.charAt(0)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Selecione os dias em que o hábito deve ser praticado
        </p>
      </div>

      {isEditing && (
        <div className="flex items-center justify-between py-2">
          <div>
            <Label htmlFor="is_active">Hábito Ativo</Label>
            <p className="text-xs text-gray-500">Desative para pausar sem excluir</p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      )}

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
            isEditing ? 'Salvar' : 'Criar Hábito'
          )}
        </Button>
      </div>
    </form>
  )
}
