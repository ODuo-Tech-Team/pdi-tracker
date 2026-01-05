'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Target, CalendarCheck, Flame, Trophy } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalGoals: number
    completedGoals: number
    inProgressGoals: number
    overdueGoals: number
    totalHabits: number
    todayCompletedHabits: number
    totalStreak: number
    bestStreak: number
    totalAchievements: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Metas',
      value: stats.totalGoals,
      subtitle: `${stats.completedGoals} concluídas`,
      icon: Target,
      color: 'bg-blue-500',
      accent: stats.overdueGoals > 0 ? `${stats.overdueGoals} atrasadas` : null,
      accentColor: 'text-red-500',
    },
    {
      title: 'Hábitos Hoje',
      value: `${stats.todayCompletedHabits}/${stats.totalHabits}`,
      subtitle: 'completados',
      icon: CalendarCheck,
      color: 'bg-green-500',
      progress: stats.totalHabits > 0 ? (stats.todayCompletedHabits / stats.totalHabits) * 100 : 0,
    },
    {
      title: 'Streak Total',
      value: stats.totalStreak,
      subtitle: `Recorde: ${stats.bestStreak} dias`,
      icon: Flame,
      color: 'bg-orange-500',
    },
    {
      title: 'Conquistas',
      value: stats.totalAchievements,
      subtitle: 'desbloqueadas',
      icon: Trophy,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold text-[#043F8D] mt-1">{card.value}</p>
                <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                {card.accent && (
                  <p className={`text-xs font-medium mt-1 ${card.accentColor}`}>
                    {card.accent}
                  </p>
                )}
              </div>
              <div className={`${card.color} p-3 rounded-xl`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            {card.progress !== undefined && (
              <div className="mt-4">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
