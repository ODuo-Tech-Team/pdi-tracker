'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Profile, Goal, Habit, STATUS_LABELS } from '@/types/database'
import { Users, Target, Flame, AlertTriangle, FileText, FileSpreadsheet, Download } from 'lucide-react'
import { exportTeamToPDF, exportTeamToExcel, exportMemberToPDF } from '@/lib/export'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TeamMember extends Profile {
  goals: Goal[]
  habits: Habit[]
}

interface EquipeListProps {
  teamMembers: TeamMember[]
  managerName: string
}

export function EquipeList({ teamMembers, managerName }: EquipeListProps) {
  if (teamMembers.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum colaborador na equipe
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Os colaboradores precisam ser vinculados a você como gestor no sistema.
            Entre em contato com o administrador para configurar sua equipe.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate team stats
  const totalGoals = teamMembers.reduce((acc, m) => acc + (m.goals?.length || 0), 0)
  const completedGoals = teamMembers.reduce(
    (acc, m) => acc + (m.goals?.filter(g => g.status === 'completed').length || 0),
    0
  )
  const overdueGoals = teamMembers.reduce(
    (acc, m) => acc + (m.goals?.filter(g => g.status === 'overdue').length || 0),
    0
  )
  const totalActiveHabits = teamMembers.reduce(
    (acc, m) => acc + (m.habits?.filter(h => h.is_active).length || 0),
    0
  )

  const handleExportTeamPDF = () => {
    exportTeamToPDF(teamMembers, managerName)
  }

  const handleExportTeamExcel = () => {
    exportTeamToExcel(teamMembers, managerName)
  }

  const handleExportMemberPDF = (member: TeamMember) => {
    exportMemberToPDF(member)
  }

  return (
    <div className="space-y-6">
      {/* Export Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Visão Geral da Equipe</h2>
          <p className="text-sm text-gray-500">{teamMembers.length} colaboradores</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportTeamPDF} className="flex items-center gap-2 cursor-pointer">
              <FileText className="h-4 w-4 text-red-500" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportTeamExcel} className="flex items-center gap-2 cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 text-green-500" />
              Exportar Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#043F8D]">{teamMembers.length}</p>
                <p className="text-sm text-gray-500">Colaboradores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#043F8D]">
                  {completedGoals}/{totalGoals}
                </p>
                <p className="text-sm text-gray-500">Metas Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#043F8D]">{totalActiveHabits}</p>
                <p className="text-sm text-gray-500">Hábitos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#043F8D]">{overdueGoals}</p>
                <p className="text-sm text-gray-500">Metas Atrasadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teamMembers.map((member) => {
          const memberGoals = member.goals || []
          const memberHabits = member.habits?.filter(h => h.is_active) || []
          const memberCompletedGoals = memberGoals.filter(g => g.status === 'completed').length
          const memberOverdueGoals = memberGoals.filter(g => g.status === 'overdue').length
          const avgProgress = memberGoals.length > 0
            ? Math.round(memberGoals.reduce((acc, g) => acc + g.progress, 0) / memberGoals.length)
            : 0
          const totalStreak = memberHabits.reduce((acc, h) => acc + (h.current_streak || 0), 0)

          return (
            <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#043F8D] rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {memberOverdueGoals > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {memberOverdueGoals} atrasada{memberOverdueGoals > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportMemberPDF(member)}
                      title="Exportar PDF do colaborador"
                    >
                      <FileText className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#043F8D]">{memberGoals.length}</p>
                    <p className="text-xs text-gray-500">Metas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#043F8D]">{memberHabits.length}</p>
                    <p className="text-xs text-gray-500">Hábitos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#F58300]">{totalStreak}</p>
                    <p className="text-xs text-gray-500">Streak</p>
                  </div>
                </div>

                {/* Progress */}
                {memberGoals.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">Progresso Médio</span>
                      <span className="font-medium">{avgProgress}%</span>
                    </div>
                    <Progress value={avgProgress} className="h-2" />
                  </div>
                )}

                {/* Recent Goals */}
                {memberGoals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Metas Recentes</p>
                    <div className="space-y-2">
                      {memberGoals.slice(0, 3).map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm truncate flex-1">{goal.title}</span>
                          <Badge
                            variant="secondary"
                            className={
                              goal.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : goal.status === 'overdue'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }
                          >
                            {STATUS_LABELS[goal.status]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {memberGoals.length === 0 && memberHabits.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Nenhuma meta ou hábito cadastrado
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
