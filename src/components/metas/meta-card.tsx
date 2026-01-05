'use client'

import { useState } from 'react'
import { Goal, CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/types/database'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, Calendar, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import Link from 'next/link'

interface MetaCardProps {
  goal: Goal
  viewMode: 'grid' | 'list'
  onEdit: (goal: Goal) => void
  onDelete: (goalId: string) => void
}

export function MetaCard({ goal, viewMode, onEdit, onDelete }: MetaCardProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return

    setLoading(true)
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goal.id)

    if (error) {
      toast.error('Erro ao excluir meta')
      setLoading(false)
      return
    }

    toast.success('Meta excluída')
    onDelete(goal.id)
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'overdue':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'profissional':
        return 'bg-blue-100 text-blue-700'
      case 'pessoal':
        return 'bg-purple-100 text-purple-700'
      case 'saude':
        return 'bg-green-100 text-green-700'
      case 'tecnico':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDaysLeft = () => {
    if (!goal.due_date) return null
    const days = differenceInDays(new Date(goal.due_date), new Date())
    if (days < 0) return { text: `${Math.abs(days)} dias atrasada`, color: 'text-red-600' }
    if (days === 0) return { text: 'Vence hoje', color: 'text-orange-600' }
    if (days === 1) return { text: 'Vence amanhã', color: 'text-yellow-600' }
    return { text: `${days} dias restantes`, color: 'text-gray-500' }
  }

  const daysInfo = getDaysLeft()

  if (viewMode === 'list') {
    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#043F8D]/10 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-[#043F8D]" />
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/dashboard/metas/${goal.id}`} className="hover:underline">
                <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getCategoryColor(goal.category)}>
                  {CATEGORY_LABELS[goal.category]}
                </Badge>
                <Badge className={getStatusColor(goal.status)}>
                  {STATUS_LABELS[goal.status]}
                </Badge>
              </div>
            </div>

            <div className="hidden md:block w-32">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Progresso</span>
                <span className="font-medium">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>

            {daysInfo && (
              <div className={`hidden lg:block text-sm ${daysInfo.color}`}>
                {daysInfo.text}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(goal)}>
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Badge className={getCategoryColor(goal.category)}>
            {CATEGORY_LABELS[goal.category]}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={loading}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
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
      <CardContent className="pt-0">
        <Link href={`/dashboard/metas/${goal.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 hover:text-[#043F8D] transition-colors">
            {goal.title}
          </h3>
        </Link>

        {goal.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{goal.description}</p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Badge className={getStatusColor(goal.status)} variant="secondary">
            {STATUS_LABELS[goal.status]}
          </Badge>
          <Badge className={getPriorityColor(goal.priority)} variant="outline">
            {PRIORITY_LABELS[goal.priority]}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Progresso</span>
            <span className="font-medium text-[#043F8D]">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        {goal.due_date && (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className={daysInfo?.color || 'text-gray-500'}>
              {format(new Date(goal.due_date), "dd 'de' MMMM", { locale: ptBR })}
              {daysInfo && ` (${daysInfo.text})`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
