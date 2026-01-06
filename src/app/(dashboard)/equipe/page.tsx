import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { EquipeList } from '@/components/equipe/equipe-list'
import { redirect } from 'next/navigation'
import { Profile, Goal, Habit } from '@/types/database'

interface TeamMember extends Profile {
  goals: Goal[]
  habits: Habit[]
}

export default async function EquipePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const profile = profileData as Profile | null

  // Only managers and admins can access this page
  if (profile?.role !== 'gestor' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get team members (users who have this user as manager)
  const { data: teamMembersData } = await supabase
    .from('profiles')
    .select(`
      *,
      goals (id, title, status, progress, due_date),
      habits (id, title, current_streak, best_streak, is_active)
    `)
    .eq('manager_id', user!.id)

  const teamMembers = (teamMembersData || []) as TeamMember[]

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Minha Equipe" />

      <div className="p-6">
        <EquipeList teamMembers={teamMembers} managerName={profile?.name || 'Gestor'} />
      </div>
    </div>
  )
}
