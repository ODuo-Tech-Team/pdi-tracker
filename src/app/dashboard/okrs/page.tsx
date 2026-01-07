import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { OKRDashboard } from '@/components/okrs/okr-dashboard'
import { redirect } from 'next/navigation'

export default async function OKRsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get active cycle
  const { data: activeCycle } = await supabase
    .from('okr_cycles')
    .select('*')
    .eq('is_active', true)
    .single()

  // Get company OKRs with KRs
  const { data: companyOKRs } = await supabase
    .from('objectives')
    .select(`
      *,
      key_results (*)
    `)
    .eq('cycle_id', activeCycle?.id || '')
    .eq('level', 'company')
    .order('created_at', { ascending: true })

  // Get area OKRs with KRs
  const { data: areaOKRs } = await supabase
    .from('objectives')
    .select(`
      *,
      key_results (*)
    `)
    .eq('cycle_id', activeCycle?.id || '')
    .eq('level', 'area')
    .order('area', { ascending: true })

  // Get user's individual OKR (if exists)
  const { data: myOKR } = await supabase
    .from('objectives')
    .select(`
      *,
      key_results (*),
      parent:objectives!parent_objective_id (
        id,
        title,
        area
      )
    `)
    .eq('cycle_id', activeCycle?.id || '')
    .eq('owner_id', user.id)
    .eq('level', 'individual')
    .single()

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="OKRs" />

      <div className="p-6">
        <OKRDashboard
          profile={profile}
          activeCycle={activeCycle}
          companyOKRs={companyOKRs || []}
          areaOKRs={areaOKRs || []}
          myOKR={myOKR}
        />
      </div>
    </div>
  )
}
