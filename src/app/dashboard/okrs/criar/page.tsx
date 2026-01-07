import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { OKRForm } from '@/components/okrs/okr-form'
import { redirect } from 'next/navigation'

export default async function CriarOKRPage() {
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

  if (!activeCycle) {
    redirect('/dashboard/okrs')
  }

  // Check if user already has an OKR for this cycle
  const { data: existingOKR } = await supabase
    .from('objectives')
    .select('id')
    .eq('cycle_id', activeCycle.id)
    .eq('owner_id', user.id)
    .eq('level', 'individual')
    .single()

  if (existingOKR) {
    redirect(`/dashboard/okrs/${existingOKR.id}`)
  }

  // Get area OKRs to link to
  const { data: areaOKRs } = await supabase
    .from('objectives')
    .select('*')
    .eq('cycle_id', activeCycle.id)
    .in('level', ['area', 'head'])
    .order('area', { ascending: true })

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Criar Meu OKR" />

      <div className="p-6">
        <OKRForm
          profile={profile}
          activeCycle={activeCycle}
          areaOKRs={areaOKRs || []}
        />
      </div>
    </div>
  )
}
