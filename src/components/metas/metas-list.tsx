'use client'

import { useState } from 'react'
import { Goal, GoalCategory, GoalStatus, CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/types/database'
import { MetaCard } from './meta-card'
import { MetaForm } from './meta-form'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MetasListProps {
  goals: Goal[]
}

export function MetasList({ goals: initialGoals }: MetasListProps) {
  const [goals, setGoals] = useState(initialGoals)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<{
    category: GoalCategory | 'all'
    status: GoalStatus | 'all'
  }>({
    category: 'all',
    status: 'all',
  })

  const filteredGoals = goals.filter(goal => {
    if (filter.category !== 'all' && goal.category !== filter.category) return false
    if (filter.status !== 'all' && goal.status !== filter.status) return false
    return true
  })

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingGoal(null)
  }

  const handleSuccess = (goal: Goal, isNew: boolean) => {
    if (isNew) {
      setGoals(prev => [goal, ...prev])
    } else {
      setGoals(prev => prev.map(g => g.id === goal.id ? goal : g))
    }
    handleClose()
  }

  const handleDelete = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId))
  }

  return (
    <div>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-[#043F8D]' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-[#043F8D]' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500 ml-2">
            {filteredGoals.length} meta{filteredGoals.length !== 1 ? 's' : ''}
          </span>
        </div>

        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#F58300] hover:bg-[#e07600]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Goals Grid/List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma meta encontrada</h3>
          <p className="text-gray-500 mb-4">Crie sua primeira meta para começar a acompanhar seu PDI</p>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#F58300] hover:bg-[#e07600]"
          >
            Criar primeira meta
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {filteredGoals.map(goal => (
            <MetaCard
              key={goal.id}
              goal={goal}
              viewMode={viewMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#043F8D]">
              {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </DialogTitle>
          </DialogHeader>
          <MetaForm
            goal={editingGoal}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
