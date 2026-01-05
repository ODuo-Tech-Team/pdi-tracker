import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ConfiguracoesForm } from '@/components/configuracoes/configuracoes-form'
import { Profile } from '@/types/database'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const profile = profileData as Profile | null

  // Get all users for manager selection (if admin)
  let allUsers: Array<{ id: string; name: string; email: string; role: string }> = []

  if (profile && profile.role === 'admin') {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .order('name')

    allUsers = (data as Array<{ id: string; name: string; email: string; role: string }>) || []
  }

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Configurações" />

      <div className="p-6">
        <ConfiguracoesForm profile={profile} allUsers={allUsers} />
      </div>
    </div>
  )
}
