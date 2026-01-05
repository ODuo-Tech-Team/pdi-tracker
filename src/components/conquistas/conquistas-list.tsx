'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Lock, Trophy } from 'lucide-react'

interface Achievement {
  type: string
  title: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: string
  progress: number
  target: number
}

interface ConquistasListProps {
  achievements: Achievement[]
}

export function ConquistasList({ achievements }: ConquistasListProps) {
  const earnedCount = achievements.filter(a => a.earned).length
  const totalCount = achievements.length

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-[#043F8D] to-[#0A5BC4]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold">{earnedCount} de {totalCount}</h2>
              <p className="text-white/70">conquistas desbloqueadas</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8 text-[#F58300]" />
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={(earnedCount / totalCount) * 100}
              className="h-2 bg-white/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <Card
            key={achievement.type}
            className={`border-0 shadow-sm transition-all ${
              achievement.earned
                ? 'bg-white'
                : 'bg-gray-50 opacity-75'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                    achievement.earned
                      ? 'bg-[#F58300]/10'
                      : 'bg-gray-200'
                  }`}
                >
                  {achievement.earned ? (
                    achievement.icon
                  ) : (
                    <Lock className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-semibold ${
                      achievement.earned ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {achievement.description}
                  </p>

                  {achievement.earned && achievement.earnedAt ? (
                    <p className="text-xs text-green-600 mt-2">
                      Desbloqueada em{' '}
                      {format(new Date(achievement.earnedAt), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  ) : (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progresso</span>
                        <span>
                          {achievement.progress}/{achievement.target}
                        </span>
                      </div>
                      <Progress
                        value={(achievement.progress / achievement.target) * 100}
                        className="h-1.5"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
