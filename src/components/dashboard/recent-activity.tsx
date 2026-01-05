'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, CalendarCheck, Trophy, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Activity {
  id: string
  type: 'goal' | 'habit' | 'achievement' | 'comment'
  title: string
  description: string
  timestamp: string
}

interface RecentActivityProps {
  userId: string
}

export function RecentActivity({ userId }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchActivity() {
      const allActivities: Activity[] = []

      // Fetch recent goals
      const { data: goals } = await supabase
        .from('goals')
        .select('id, title, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5)

      goals?.forEach(goal => {
        allActivities.push({
          id: `goal-${goal.id}`,
          type: 'goal',
          title: goal.title,
          description: goal.status === 'completed' ? 'Meta concluída' : 'Meta atualizada',
          timestamp: goal.updated_at,
        })
      })

      // Fetch recent habit logs
      const { data: logs } = await supabase
        .from('habit_logs')
        .select(`
          id,
          created_at,
          completed,
          habits (title)
        `)
        .eq('completed', true)
        .order('created_at', { ascending: false })
        .limit(5)

      logs?.forEach((log: any) => {
        const habitTitle = Array.isArray(log.habits) ? log.habits[0]?.title : log.habits?.title
        if (habitTitle) {
          allActivities.push({
            id: `log-${log.id}`,
            type: 'habit',
            title: habitTitle,
            description: 'Check-in realizado',
            timestamp: log.created_at,
          })
        }
      })

      // Fetch recent achievements
      const { data: achievements } = await supabase
        .from('achievements')
        .select('id, type, unlocked_at')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })
        .limit(3)

      achievements?.forEach(achievement => {
        allActivities.push({
          id: `achievement-${achievement.id}`,
          type: 'achievement',
          title: 'Conquista Desbloqueada',
          description: achievement.type,
          timestamp: achievement.unlocked_at,
        })
      })

      // Sort by timestamp and take top 10
      allActivities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setActivities(allActivities.slice(0, 10))
      setLoading(false)
    }

    fetchActivity()
  }, [userId, supabase])

  const getIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Target className="h-4 w-4" />
      case 'habit':
        return <CalendarCheck className="h-4 w-4" />
      case 'achievement':
        return <Trophy className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'bg-blue-100 text-blue-600'
      case 'habit':
        return 'bg-green-100 text-green-600'
      case 'achievement':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#043F8D]">
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#043F8D]">
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Nenhuma atividade ainda. Comece criando uma meta ou hábito!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#043F8D]">
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${getIconColor(activity.type)}`}>
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.description}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
