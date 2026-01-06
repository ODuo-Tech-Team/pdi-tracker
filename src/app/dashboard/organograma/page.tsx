import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { OrgChart } from '@/components/organograma/org-chart'
import { Profile, OrgChartNode } from '@/types/database'

function buildOrgTree(users: Profile[]): OrgChartNode[] {
  // Find root users (no manager or managers who don't exist)
  const userMap = new Map(users.map(u => [u.id, u]))

  // Find top-level users (admins without managers, or users whose manager doesn't exist)
  const rootUsers = users.filter(u => {
    if (!u.manager_id) return true
    if (!userMap.has(u.manager_id)) return true
    return false
  })

  // Build tree recursively
  function buildNode(user: Profile): OrgChartNode {
    const subordinates = users
      .filter(u => u.manager_id === user.id)
      .map(buildNode)

    return {
      ...user,
      subordinates,
    }
  }

  // Sort: admins first, then gestors, then colaboradores
  const roleOrder = { admin: 0, gestor: 1, colaborador: 2 }
  rootUsers.sort((a, b) => roleOrder[a.role] - roleOrder[b.role])

  return rootUsers.map(buildNode)
}

export default async function OrganogramaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is manager or admin
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  if (profile?.role !== 'gestor' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get all active users
  const { data: usersData } = await supabase
    .from('profiles')
    .select('*')
    .order('name')

  const users = ((usersData || []) as Profile[]).filter(u => u.is_active !== false)

  // Build the org tree
  const orgTree = buildOrgTree(users)

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Organograma" />

      <div className="p-6">
        <OrgChart tree={orgTree} currentUserId={user.id} isAdmin={profile?.role === 'admin'} />
      </div>
    </div>
  )
}
