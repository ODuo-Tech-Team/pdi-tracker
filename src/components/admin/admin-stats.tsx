'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, UserCheck, UserX, Target, CheckCircle, CalendarCheck } from 'lucide-react'

interface AdminStatsProps {
  stats: {
    total_users: number
    total_admins: number
    total_gestores: number
    total_colaboradores: number
    active_users: number
    inactive_users: number
    total_goals: number
    completed_goals: number
    total_habits: number
  }
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      label: 'Total de Usuários',
      value: stats.total_users,
      icon: Users,
      color: 'bg-blue-500',
      subtitle: `${stats.total_admins} admin, ${stats.total_gestores} gestores, ${stats.total_colaboradores} colaboradores`,
    },
    {
      label: 'Usuários Ativos',
      value: stats.active_users,
      icon: UserCheck,
      color: 'bg-green-500',
      subtitle: `${stats.inactive_users} inativos`,
    },
    {
      label: 'Total de Metas',
      value: stats.total_goals,
      icon: Target,
      color: 'bg-orange-500',
      subtitle: `${stats.completed_goals} concluídas`,
    },
    {
      label: 'Hábitos Ativos',
      value: stats.total_habits,
      icon: CalendarCheck,
      color: 'bg-purple-500',
      subtitle: 'Em toda a empresa',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-[#043F8D] mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
