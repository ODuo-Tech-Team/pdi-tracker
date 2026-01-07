import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { OKRDetail } from '@/components/okrs/okr-detail'
import { redirect, notFound } from 'next/navigation'

interface OKRDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OKRDetailPage({ params }: OKRDetailPageProps) {
  const { id } = await params
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

  // Get the objective with all related data
  const { data: objective, error } = await supabase
    .from('objectives')
    .select(`
      *,
      key_results (
        *
      ),
      owner:profiles!owner_id (
        id,
        name,
        email,
        avatar_url,
        department,
        position
      ),
      parent:objectives!parent_objective_id (
        id,
        title,
        area,
        level
      ),
      cycle:okr_cycles!cycle_id (
        id,
        name,
        start_date,
        end_date
      )
    `)
    .eq('id', id)
    .single()

  if (error || !objective) {
    notFound()
  }

  // Get child objectives (for company/area OKRs)
  const { data: childObjectives } = await supabase
    .from('objectives')
    .select(`
      *,
      key_results (*),
      owner:profiles!owner_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq('parent_objective_id', id)
    .order('created_at', { ascending: true })

  // Get check-ins for KRs if this is user's own OKR
  let checkIns: Record<string, any[]> = {}
  if (objective.owner_id === user.id || profile?.role === 'admin' || profile?.role === 'gestor') {
    for (const kr of objective.key_results || []) {
      const { data: krCheckIns } = await supabase
        .from('kr_check_ins')
        .select('*')
        .eq('key_result_id', kr.id)
        .order('check_in_date', { ascending: false })
        .limit(5)

      checkIns[kr.id] = krCheckIns || []
    }
  }

  // Check if user can edit
  const canEdit = objective.owner_id === user.id &&
    ['draft', 'rejected'].includes(objective.status)

  // Check if user can validate (is manager of owner)
  const canValidate = profile?.role !== 'colaborador' &&
    objective.status === 'pending_validation' &&
    objective.level === 'individual'

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Detalhes do OKR" />

      <div className="p-6">
        <OKRDetail
          objective={objective}
          childObjectives={childObjectives || []}
          checkIns={checkIns}
          profile={profile}
          canEdit={canEdit}
          canValidate={canValidate}
        />
      </div>
    </div>
  )
}
