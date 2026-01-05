'use client'

import { useState } from 'react'
import { Habit, HabitLog } from '@/types/database'
import { HabitoCard } from './habito-card'
import { HabitoForm } from './habito-form'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface HabitWithLogs extends Habit {
  habit_logs: HabitLog[]
}

interface HabitosListProps {
  habits: HabitWithLogs[]
}

export function HabitosList({ habits: initialHabits }: HabitosListProps) {
  const [habits, setHabits] = useState(initialHabits)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null)
  const [tab, setTab] = useState<'active' | 'inactive'>('active')

  const activeHabits = habits.filter(h => h.is_active)
  const inactiveHabits = habits.filter(h => !h.is_active)

  const handleEdit = (habit: HabitWithLogs) => {
    setEditingHabit(habit)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingHabit(null)
  }

  const handleSuccess = (habit: Habit, isNew: boolean) => {
    const habitWithLogs = { ...habit, habit_logs: [] } as HabitWithLogs
    if (isNew) {
      setHabits(prev => [habitWithLogs, ...prev])
    } else {
      setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, ...habit } : h))
    }
    handleClose()
  }

  const handleDelete = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId))
  }

  const handleLogUpdate = (habitId: string, log: HabitLog) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h
      const existingLogIndex = h.habit_logs.findIndex(l => l.date === log.date)
      if (existingLogIndex >= 0) {
        const newLogs = [...h.habit_logs]
        newLogs[existingLogIndex] = log
        return { ...h, habit_logs: newLogs }
      }
      return { ...h, habit_logs: [...h.habit_logs, log] }
    }))
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'inactive')}>
          <TabsList>
            <TabsTrigger value="active">
              Ativos ({activeHabits.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inativos ({inactiveHabits.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#F58300] hover:bg-[#e07600]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Hábito
        </Button>
      </div>

      {/* Habits Grid */}
      {tab === 'active' ? (
        activeHabits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum hábito ativo</h3>
            <p className="text-gray-500 mb-4">Crie seu primeiro hábito para começar a rastrear</p>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-[#F58300] hover:bg-[#e07600]"
            >
              Criar primeiro hábito
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeHabits.map(habit => (
              <HabitoCard
                key={habit.id}
                habit={habit}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onLogUpdate={handleLogUpdate}
              />
            ))}
          </div>
        )
      ) : (
        inactiveHabits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <p className="text-gray-500">Nenhum hábito inativo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveHabits.map(habit => (
              <HabitoCard
                key={habit.id}
                habit={habit}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onLogUpdate={handleLogUpdate}
              />
            ))}
          </div>
        )
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#043F8D]">
              {editingHabit ? 'Editar Hábito' : 'Novo Hábito'}
            </DialogTitle>
          </DialogHeader>
          <HabitoForm
            habit={editingHabit}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
