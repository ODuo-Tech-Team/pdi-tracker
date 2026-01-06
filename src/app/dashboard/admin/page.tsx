import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { AdminStats } from '@/components/admin/admin-stats'
import { UsersTable } from '@/components/admin/users-table'
import { Profile } from '@/types/database'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get all users
  const { data: usersData } = await supabase
    .from('profiles')
    .select('*')
    .order('name')

  const users = (usersData || []) as Profile[]

  // Get managers for the dropdown
  const managers = users.filter(u => u.role === 'gestor' || u.role === 'admin')

  // Calculate stats
  const stats = {
    total_users: users.length,
    total_admins: users.filter(u => u.role === 'admin').length,
    total_gestores: users.filter(u => u.role === 'gestor').length,
    total_colaboradores: users.filter(u => u.role === 'colaborador').length,
    active_users: users.filter(u => u.is_active !== false).length,
    inactive_users: users.filter(u => u.is_active === false).length,
  }

  // Get goals and habits counts
  const { count: goalsCount } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })

  const { count: completedGoalsCount } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  const { count: habitsCount } = await supabase
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const extendedStats = {
    ...stats,
    total_goals: goalsCount || 0,
    completed_goals: completedGoalsCount || 0,
    total_habits: habitsCount || 0,
  }

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Administração" />

      <div className="p-6 space-y-6">
        <AdminStats stats={extendedStats} />
        <UsersTable users={users} managers={managers} currentUserId={user.id} />
      </div>
    </div>
  )
}
