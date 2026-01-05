import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { MetasList } from '@/components/metas/metas-list'
import { MetaFilters } from '@/components/metas/meta-filters'

export default async function MetasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Metas" />

      <div className="p-6 space-y-6">
        <MetaFilters />
        <MetasList goals={goals || []} />
      </div>
    </div>
  )
}
