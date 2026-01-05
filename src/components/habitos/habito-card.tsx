'use client'

import { useState } from 'react'
import { Habit, HabitLog, HABIT_TYPE_LABELS, WEEKDAY_LABELS } from '@/types/database'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, Flame, Check, X, Minus, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface HabitWithLogs extends Habit {
  habit_logs: HabitLog[]
}

interface HabitoCardProps {
  habit: HabitWithLogs
  onEdit: (habit: HabitWithLogs) => void
  onDelete: (habitId: string) => void
  onLogUpdate: (habitId: string, log: HabitLog) => void
}

export function HabitoCard({ habit, onEdit, onDelete, onLogUpdate }: HabitoCardProps) {
  const [loading, setLoading] = useState(false)
  const [counterValue, setCounterValue] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]
  const todayLog = habit.habit_logs?.find(log => log.date === today)
  const isCompletedToday = todayLog?.completed || false

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este hábito?')) return

    setLoading(true)
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habit.id)

    if (error) {
      toast.error('Erro ao excluir hábito')
      setLoading(false)
      return
    }

    toast.success('Hábito excluído')
    onDelete(habit.id)
    setLoading(false)
  }

  const handleBooleanCheckIn = async () => {
    setLoading(true)

    if (todayLog) {
      // Toggle
      const { data, error } = await supabase
        .from('habit_logs')
        .update({ completed: !todayLog.completed })
        .eq('id', todayLog.id)
        .select()
        .single()

      if (error) {
        toast.error('Erro ao atualizar')
        setLoading(false)
        return
      }

      onLogUpdate(habit.id, data)
      toast.success(data.completed ? 'Check-in realizado!' : 'Check-in removido')
    } else {
      // Create
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habit.id,
          date: today,
          completed: true,
          value: 1,
        })
        .select()
        .single()

      if (error) {
        toast.error('Erro ao fazer check-in')
        setLoading(false)
        return
      }

      onLogUpdate(habit.id, data)
      toast.success('Check-in realizado!')
    }

    router.refresh()
    setLoading(false)
  }

  const handleCounterCheckIn = async (delta: number) => {
    setLoading(true)
    const currentValue = todayLog?.value || 0
    const newValue = Math.max(0, currentValue + delta)
    const completed = newValue >= habit.target_value

    if (todayLog) {
      const { data, error } = await supabase
        .from('habit_logs')
        .update({ value: newValue, completed })
        .eq('id', todayLog.id)
        .select()
        .single()

      if (error) {
        toast.error('Erro ao atualizar')
        setLoading(false)
        return
      }

      onLogUpdate(habit.id, data)
    } else {
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habit.id,
          date: today,
          completed,
          value: newValue,
        })
        .select()
        .single()

      if (error) {
        toast.error('Erro ao fazer check-in')
        setLoading(false)
        return
      }

      onLogUpdate(habit.id, data)
    }

    router.refresh()
    setLoading(false)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'boolean':
        return 'bg-blue-100 text-blue-700'
      case 'counter':
        return 'bg-purple-100 text-purple-700'
      case 'time':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const currentValue = todayLog?.value || 0
  const progressPercent = habit.type !== 'boolean'
    ? Math.min(100, (currentValue / habit.target_value) * 100)
    : isCompletedToday ? 100 : 0

  return (
    <Card className={`border-0 shadow-sm hover:shadow-md transition-all ${!habit.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getTypeColor(habit.type)}>
              {HABIT_TYPE_LABELS[habit.type]}
            </Badge>
            {habit.current_streak > 0 && (
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">{habit.current_streak}</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(habit)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900">{habit.title}</h3>
          {habit.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{habit.description}</p>
          )}
        </div>

        {/* Frequency */}
        <div className="flex gap-1">
          {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day) => (
            <div
              key={day}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                habit.frequency.includes(day)
                  ? 'bg-[#043F8D] text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {day.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {habit.type !== 'boolean' && (
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">Progresso</span>
              <span className="font-medium">
                {currentValue}/{habit.target_value}
                {habit.type === 'time' ? ' min' : ''}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isCompletedToday ? 'bg-green-500' : 'bg-[#F58300]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Check-in Section */}
        <div className="pt-2 border-t">
          {habit.type === 'boolean' ? (
            <Button
              onClick={handleBooleanCheckIn}
              disabled={loading || !habit.is_active}
              className={`w-full ${
                isCompletedToday
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-[#F58300] hover:bg-[#e07600]'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isCompletedToday ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Concluído!
                </>
              ) : (
                'Marcar como feito'
              )}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCounterCheckIn(-1)}
                disabled={loading || currentValue === 0 || !habit.is_active}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-2xl font-bold text-[#043F8D] w-16 text-center">
                {currentValue}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCounterCheckIn(1)}
                disabled={loading || !habit.is_active}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Best Streak */}
        {habit.best_streak > 0 && (
          <div className="text-center text-xs text-gray-400">
            Recorde: {habit.best_streak} dias consecutivos
          </div>
        )}
      </CardContent>
    </Card>
  )
}
