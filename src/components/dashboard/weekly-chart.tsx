'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WeeklyChartProps {
  userId: string
}

export function WeeklyChart({ userId }: WeeklyChartProps) {
  const [data, setData] = useState<Array<{ date: string; day: string; completed: number; total: number }>>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const days = []
      const today = startOfDay(new Date())

      // Get habits
      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)

      const totalHabits = habits?.length || 0

      // Get logs for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i)
        const dateStr = format(date, 'yyyy-MM-dd')

        const { data: logs } = await supabase
          .from('habit_logs')
          .select('id, completed')
          .eq('date', dateStr)
          .eq('completed', true)
          .in('habit_id', habits?.map(h => h.id) || [])

        days.push({
          date: dateStr,
          day: format(date, 'EEE', { locale: ptBR }),
          completed: logs?.length || 0,
          total: totalHabits,
        })
      }

      setData(days)
      setLoading(false)
    }

    fetchData()
  }, [userId, supabase])

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#043F8D]">
            Progresso Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#043F8D]">
          Progresso Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [
                  value,
                  name === 'completed' ? 'Completados' : 'Total',
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Legend
                formatter={(value) => (value === 'completed' ? 'Completados' : 'Meta')}
              />
              <Bar
                dataKey="completed"
                fill="#F58300"
                radius={[4, 4, 0, 0]}
                name="completed"
              />
              <Bar
                dataKey="total"
                fill="#e2e8f0"
                radius={[4, 4, 0, 0]}
                name="total"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
