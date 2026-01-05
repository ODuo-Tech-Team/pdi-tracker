'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Habit, HabitLog } from '@/types/database'
import { format, subDays, startOfWeek, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HabitWithLogs extends Habit {
  habit_logs: HabitLog[]
}

interface HeatmapCalendarProps {
  habits: HabitWithLogs[]
}

export function HeatmapCalendar({ habits }: HeatmapCalendarProps) {
  const [selectedHabit, setSelectedHabit] = useState<string | 'all'>('all')

  // Generate last 90 days
  const today = new Date()
  const startDate = subDays(today, 89)

  // Create a map of date -> completion count
  const completionMap = new Map<string, { completed: number; total: number }>()

  // Initialize all dates
  for (let i = 0; i < 90; i++) {
    const date = format(addDays(startDate, i), 'yyyy-MM-dd')
    completionMap.set(date, { completed: 0, total: 0 })
  }

  // Count completions
  const filteredHabits = selectedHabit === 'all'
    ? habits.filter(h => h.is_active)
    : habits.filter(h => h.id === selectedHabit)

  filteredHabits.forEach(habit => {
    habit.habit_logs?.forEach(log => {
      const existing = completionMap.get(log.date)
      if (existing) {
        existing.total++
        if (log.completed) existing.completed++
      }
    })
  })

  // Group by weeks for display
  const weeks: string[][] = []
  let currentWeek: string[] = []

  // Pad start to align with week start (Monday)
  const startWeekDay = startDate.getDay()
  const paddingStart = startWeekDay === 0 ? 6 : startWeekDay - 1
  for (let i = 0; i < paddingStart; i++) {
    currentWeek.push('')
  }

  for (let i = 0; i < 90; i++) {
    const date = format(addDays(startDate, i), 'yyyy-MM-dd')
    currentWeek.push(date)

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Add remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push('')
    }
    weeks.push(currentWeek)
  }

  const getIntensity = (date: string) => {
    if (!date) return 'bg-transparent'
    const data = completionMap.get(date)
    if (!data || data.total === 0) return 'bg-gray-100'

    const ratio = data.completed / Math.max(data.total, filteredHabits.length)

    if (ratio === 0) return 'bg-gray-100'
    if (ratio <= 0.25) return 'bg-green-200'
    if (ratio <= 0.5) return 'bg-green-300'
    if (ratio <= 0.75) return 'bg-green-400'
    return 'bg-green-500'
  }

  const getTooltipContent = (date: string) => {
    if (!date) return ''
    const data = completionMap.get(date)
    const formattedDate = format(new Date(date), "dd 'de' MMMM", { locale: ptBR })

    if (!data || data.total === 0) {
      return `${formattedDate}\nNenhum registro`
    }

    return `${formattedDate}\n${data.completed} de ${Math.max(data.total, filteredHabits.length)} completados`
  }

  // Month labels
  const months: { label: string; weekIndex: number }[] = []
  let lastMonth = ''
  weeks.forEach((week, weekIndex) => {
    const firstValidDate = week.find(d => d)
    if (firstValidDate) {
      const month = format(new Date(firstValidDate), 'MMM', { locale: ptBR })
      if (month !== lastMonth) {
        months.push({ label: month, weekIndex })
        lastMonth = month
      }
    }
  })

  if (habits.length === 0) {
    return null
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-[#043F8D]">
          Calendário de Hábitos
        </CardTitle>
        <select
          value={selectedHabit}
          onChange={(e) => setSelectedHabit(e.target.value)}
          className="text-sm border rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#F58300] focus:border-[#F58300]"
        >
          <option value="all">Todos os hábitos</option>
          {habits.filter(h => h.is_active).map(habit => (
            <option key={habit.id} value={habit.id}>
              {habit.title}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            {/* Month labels */}
            <div className="flex mb-1 ml-8">
              {months.map((month, idx) => (
                <div
                  key={idx}
                  className="text-xs text-gray-500"
                  style={{ marginLeft: idx === 0 ? 0 : `${(month.weekIndex - (months[idx - 1]?.weekIndex || 0) - 1) * 14}px` }}
                >
                  {month.label}
                </div>
              ))}
            </div>

            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-2 text-xs text-gray-500">
                <span className="h-3">Seg</span>
                <span className="h-3"></span>
                <span className="h-3">Qua</span>
                <span className="h-3"></span>
                <span className="h-3">Sex</span>
                <span className="h-3"></span>
                <span className="h-3">Dom</span>
              </div>

              {/* Heatmap grid */}
              <div className="flex gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((date, dayIndex) => (
                      <Tooltip key={`${weekIndex}-${dayIndex}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-3 h-3 rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-gray-400 ${getIntensity(date)}`}
                          />
                        </TooltipTrigger>
                        {date && (
                          <TooltipContent>
                            <p className="whitespace-pre-line text-xs">
                              {getTooltipContent(date)}
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
            <span>Menos</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100" />
              <div className="w-3 h-3 rounded-sm bg-green-200" />
              <div className="w-3 h-3 rounded-sm bg-green-300" />
              <div className="w-3 h-3 rounded-sm bg-green-400" />
              <div className="w-3 h-3 rounded-sm bg-green-500" />
            </div>
            <span>Mais</span>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
