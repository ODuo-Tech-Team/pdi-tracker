'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Habit, HabitLog } from '@/types/database'
import { Check, Flame, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

interface HabitWithLogs extends Habit {
  habit_logs: HabitLog[]
}

interface TodayHabitsProps {
  habits: HabitWithLogs[]
}

export function TodayHabits({ habits: initialHabits }: TodayHabitsProps) {
  const [habits, setHabits] = useState(initialHabits)
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const handleCheckIn = async (habit: HabitWithLogs) => {
    setLoading(habit.id)

    const existingLog = habit.habit_logs?.find(log => log.date === today)

    if (existingLog) {
      // Toggle completion
      const { error } = await supabase
        .from('habit_logs')
        .update({ completed: !existingLog.completed })
        .eq('id', existingLog.id)

      if (error) {
        toast.error('Erro ao atualizar check-in')
        setLoading(null)
        return
      }
    } else {
      // Create new log
      const { error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habit.id,
          date: today,
          completed: true,
          value: habit.type === 'boolean' ? 1 : 0,
        })

      if (error) {
        toast.error('Erro ao fazer check-in')
        setLoading(null)
        return
      }
    }

    // Update local state
    setHabits(prev =>
      prev.map(h => {
        if (h.id !== habit.id) return h
        const existingLog = h.habit_logs?.find(log => log.date === today)
        if (existingLog) {
          return {
            ...h,
            habit_logs: h.habit_logs.map(log =>
              log.id === existingLog.id ? { ...log, completed: !log.completed } : log
            ),
          }
        }
        return {
          ...h,
          habit_logs: [...(h.habit_logs || []), { id: 'temp', habit_id: h.id, date: today, completed: true, value: 1, notes: null, created_at: new Date().toISOString() }],
        }
      })
    )

    toast.success(existingLog?.completed ? 'Check-in removido' : 'Check-in realizado!')
    setLoading(null)
    router.refresh()
  }

  const isCompletedToday = (habit: HabitWithLogs) => {
    return habit.habit_logs?.some(log => log.date === today && log.completed)
  }

  if (habits.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#043F8D]">
            Hábitos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Nenhum hábito cadastrado</p>
            <Link href="/dashboard/habitos">
              <Button className="bg-[#F58300] hover:bg-[#e07600]">
                <Plus className="h-4 w-4 mr-2" />
                Criar Hábito
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-[#043F8D]">
          Hábitos de Hoje
        </CardTitle>
        <Link href="/dashboard/habitos">
          <Button variant="ghost" size="sm" className="text-[#F58300]">
            Ver todos
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {habits.slice(0, 5).map((habit) => {
          const completed = isCompletedToday(habit)
          return (
            <div
              key={habit.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                completed ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCheckIn(habit)}
                  disabled={loading === habit.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    completed
                      ? 'bg-green-500 text-white'
                      : 'bg-white border-2 border-gray-300 hover:border-[#F58300]'
                  }`}
                >
                  {loading === habit.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : completed ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                </button>
                <div>
                  <p className={`font-medium ${completed ? 'text-green-700' : 'text-gray-900'}`}>
                    {habit.title}
                  </p>
                  {habit.current_streak > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-500">
                      <Flame className="h-3 w-3" />
                      <span>{habit.current_streak} dias</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
