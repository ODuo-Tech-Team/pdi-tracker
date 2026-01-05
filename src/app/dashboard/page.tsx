import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { WeeklyChart } from '@/components/dashboard/weekly-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UpcomingGoals } from '@/components/dashboard/upcoming-goals'
import { TodayHabits } from '@/components/dashboard/today-habits'
import { Profile, Goal, Habit, HabitLog, Achievement } from '@/types/database'

interface HabitWithLogs extends Habit {
  habit_logs: HabitLog[]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const profile = profileData as Profile | null

  // Get goals stats
  const { data: goalsData } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user!.id)

  const goals = (goalsData || []) as Goal[]

  // Get habits with today's log
  const today = new Date().toISOString().split('T')[0]
  const { data: habitsData } = await supabase
    .from('habits')
    .select(`
      *,
      habit_logs (
        id,
        date,
        completed,
        value
      )
    `)
    .eq('user_id', user!.id)
    .eq('is_active', true)

  const habits = (habitsData || []) as HabitWithLogs[]

  // Get achievements
  const { data: achievementsData } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', user!.id)

  const achievements = (achievementsData || []) as Achievement[]

  // Calculate stats
  const totalGoals = goals.length
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').length
  const overdueGoals = goals.filter(g => g.status === 'overdue').length

  const totalHabits = habits.length
  const todayCompletedHabits = habits.filter(h =>
    h.habit_logs?.some(log => log.date === today && log.completed)
  ).length

  const totalStreak = habits.reduce((acc, h) => acc + (h.current_streak || 0), 0)
  const bestStreak = habits.reduce((acc, h) => Math.max(acc, h.best_streak || 0), 0)

  const stats = {
    totalGoals,
    completedGoals,
    inProgressGoals,
    overdueGoals,
    totalHabits,
    todayCompletedHabits,
    totalStreak,
    bestStreak,
    totalAchievements: achievements.length,
  }

  // Get upcoming goals (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingGoals = goals.filter(g => {
    if (!g.due_date) return false
    const dueDate = new Date(g.due_date)
    return dueDate <= nextWeek && g.status !== 'completed'
  }).slice(0, 5)

  return (
    <div className="min-h-screen">
      <Header profile={profile} title={`Olá, ${profile?.name?.split(' ')[0] || 'Usuário'}!`} />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart and Activity */}
          <div className="lg:col-span-2 space-y-6">
            <WeeklyChart userId={user!.id} />
            <RecentActivity userId={user!.id} />
          </div>

          {/* Right Column - Today's Habits and Upcoming */}
          <div className="space-y-6">
            <TodayHabits habits={habits} />
            <UpcomingGoals goals={upcomingGoals} />
          </div>
        </div>
      </div>
    </div>
  )
}
