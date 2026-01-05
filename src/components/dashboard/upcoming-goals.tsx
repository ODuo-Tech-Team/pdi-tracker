'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Goal, CATEGORY_LABELS, PRIORITY_LABELS } from '@/types/database'
import { Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import { format, differenceInDays, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UpcomingGoalsProps {
  goals: Goal[]
}

export function UpcomingGoals({ goals }: UpcomingGoalsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDaysLeft = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date())
    if (days < 0) return { text: 'Atrasada', color: 'text-red-600' }
    if (days === 0) return { text: 'Hoje', color: 'text-orange-600' }
    if (days === 1) return { text: 'Amanhã', color: 'text-yellow-600' }
    return { text: `${days} dias`, color: 'text-gray-600' }
  }

  if (goals.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#043F8D]">
            Próximas Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Nenhuma meta com prazo próximo</p>
            <Link href="/dashboard/metas">
              <Button className="bg-[#F58300] hover:bg-[#e07600]">
                <Plus className="h-4 w-4 mr-2" />
                Criar Meta
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
          Próximas Metas
        </CardTitle>
        <Link href="/dashboard/metas">
          <Button variant="ghost" size="sm" className="text-[#F58300]">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.map((goal) => {
          const daysInfo = goal.due_date ? getDaysLeft(goal.due_date) : null
          return (
            <Link
              key={goal.id}
              href={`/dashboard/metas/${goal.id}`}
              className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{goal.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[goal.category]}
                    </Badge>
                    <Badge className={`text-xs ${getPriorityColor(goal.priority)}`}>
                      {PRIORITY_LABELS[goal.priority]}
                    </Badge>
                  </div>
                </div>
                {daysInfo && (
                  <span className={`text-xs font-medium whitespace-nowrap ${daysInfo.color}`}>
                    {daysInfo.text}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-[#F58300] h-1.5 rounded-full transition-all"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{goal.progress}% concluído</p>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
