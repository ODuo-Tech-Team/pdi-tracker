import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ConquistasList } from '@/components/conquistas/conquistas-list'
import { ACHIEVEMENT_INFO, ACHIEVEMENT_TYPES, Profile, Achievement } from '@/types/database'

export default async function ConquistasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const profile = profileData as Profile | null

  const { data: achievementsData } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', user!.id)
    .order('unlocked_at', { ascending: false })

  const achievements = achievementsData as Achievement[] | null

  // Get habits count for potential achievements
  const { count: habitsCount } = await supabase
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('is_active', true)

  // Get goals count
  const { count: goalsCount } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { count: completedGoalsCount } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'completed')

  // Get best streak
  const { data: habitsData } = await supabase
    .from('habits')
    .select('best_streak, current_streak')
    .eq('user_id', user!.id)

  const habits = habitsData as Array<{ best_streak: number; current_streak: number }> | null

  const bestStreak = habits?.reduce((max, h) => Math.max(max, h.best_streak || 0), 0) || 0
  const currentStreak = habits?.reduce((max, h) => Math.max(max, h.current_streak || 0), 0) || 0

  // Calculate potential achievements
  const allAchievements = Object.entries(ACHIEVEMENT_INFO).map(([type, info]) => {
    const earned = achievements?.find(a => a.type === type)
    let progress = 0
    let target = 1

    switch (type) {
      case ACHIEVEMENT_TYPES.STREAK_7:
        progress = Math.min(currentStreak, 7)
        target = 7
        break
      case ACHIEVEMENT_TYPES.STREAK_30:
        progress = Math.min(bestStreak, 30)
        target = 30
        break
      case ACHIEVEMENT_TYPES.STREAK_100:
        progress = Math.min(bestStreak, 100)
        target = 100
        break
      case ACHIEVEMENT_TYPES.FIRST_GOAL:
        progress = Math.min(goalsCount || 0, 1)
        target = 1
        break
      case ACHIEVEMENT_TYPES.GOAL_COMPLETED:
        progress = Math.min(completedGoalsCount || 0, 1)
        target = 1
        break
      case ACHIEVEMENT_TYPES.FIVE_HABITS:
        progress = Math.min(habitsCount || 0, 5)
        target = 5
        break
      case ACHIEVEMENT_TYPES.FIRST_CHECKIN:
        progress = earned ? 1 : 0
        target = 1
        break
    }

    return {
      type,
      ...info,
      earned: !!earned,
      earnedAt: earned?.unlocked_at,
      progress,
      target,
    }
  })

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Conquistas" />

      <div className="p-6">
        <ConquistasList achievements={allAchievements} />
      </div>
    </div>
  )
}
