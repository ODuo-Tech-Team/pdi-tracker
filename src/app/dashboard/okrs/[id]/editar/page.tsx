import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { OKREditForm } from '@/components/okrs/okr-edit-form'
import { redirect, notFound } from 'next/navigation'

interface OKREditPageProps {
  params: Promise<{ id: string }>
}

export default async function OKREditPage({ params }: OKREditPageProps) {
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

  // Get the objective with key results
  const { data: objective, error } = await supabase
    .from('objectives')
    .select(`
      *,
      key_results (*)
    `)
    .eq('id', id)
    .single()

  if (error || !objective) {
    notFound()
  }

  // Check if user can edit
  const canEdit = objective.owner_id === user.id &&
    ['draft', 'rejected'].includes(objective.status)

  if (!canEdit) {
    redirect(`/dashboard/okrs/${id}`)
  }

  // Get active cycle
  const { data: activeCycle } = await supabase
    .from('okr_cycles')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!activeCycle) {
    redirect('/dashboard/okrs')
  }

  // Get area OKRs for parent selection
  const { data: areaOKRs } = await supabase
    .from('objectives')
    .select('*')
    .eq('cycle_id', activeCycle.id)
    .eq('level', 'area')
    .eq('status', 'approved')
    .order('area')

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Editar OKR" />

      <div className="p-6">
        <OKREditForm
          profile={profile}
          activeCycle={activeCycle}
          areaOKRs={areaOKRs || []}
          objective={objective}
          keyResults={objective.key_results || []}
        />
      </div>
    </div>
  )
}
