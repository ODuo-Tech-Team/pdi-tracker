import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { KPIList } from '@/components/kpis/kpi-list'
import { Profile, KPI, KPIWithValues } from '@/types/database'

export default async function KPIsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  // Get user's KPIs with values
  const { data: kpisData } = await supabase
    .from('kpis')
    .select(`
      *,
      owner:profiles!kpis_owner_id_fkey(*),
      linked_objective:objectives(*)
    `)
    .or(`owner_id.eq.${user.id},area.eq.${profile?.area}`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Get KPI values for each KPI
  const kpis: KPIWithValues[] = []
  for (const kpi of kpisData || []) {
    const { data: values } = await supabase
      .from('kpi_values')
      .select('*')
      .eq('kpi_id', kpi.id)
      .order('recorded_at', { ascending: false })
      .limit(30)

    kpis.push({
      ...kpi,
      values: values || [],
    })
  }

  // Get all OKRs for linking (approved objectives)
  const { data: objectives } = await supabase
    .from('objectives')
    .select('id, title, area')
    .in('status', ['approved', 'tracking'])
    .order('title')

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="KPIs" />
      <div className="p-6">
        <KPIList
          kpis={kpis}
          profile={profile}
          objectives={objectives || []}
        />
      </div>
    </div>
  )
}
