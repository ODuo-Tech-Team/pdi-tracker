import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { HabitosList } from '@/components/habitos/habitos-list'
import { HeatmapCalendar } from '@/components/habitos/heatmap-calendar'

export default async function HabitosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Get habits with logs from last 90 days
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: habits } = await supabase
    .from('habits')
    .select(`
      *,
      habit_logs (
        id,
        date,
        completed,
        value,
        notes
      )
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Hábitos" />

      <div className="p-6 space-y-6">
        {/* Heatmap Overview */}
        <HeatmapCalendar habits={habits || []} />

        {/* Habits List */}
        <HabitosList habits={habits || []} />
      </div>
    </div>
  )
}
