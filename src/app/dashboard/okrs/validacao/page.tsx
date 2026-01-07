import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { OKRValidationList } from '@/components/okrs/okr-validation-list'
import { redirect } from 'next/navigation'

export default async function OKRValidacaoPage() {
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

  // Only managers and admins can access
  if (profile?.role === 'colaborador') {
    redirect('/dashboard/okrs')
  }

  // Get pending validation OKRs from team members
  let pendingOKRs = []

  if (profile?.role === 'admin') {
    // Admin sees all pending
    const { data } = await supabase
      .from('objectives')
      .select(`
        *,
        key_results (*),
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
          area
        )
      `)
      .eq('status', 'pending_validation')
      .eq('level', 'individual')
      .order('created_at', { ascending: true })

    pendingOKRs = data || []
  } else {
    // Manager sees only their team's pending
    const { data } = await supabase
      .from('objectives')
      .select(`
        *,
        key_results (*),
        owner:profiles!owner_id (
          id,
          name,
          email,
          avatar_url,
          department,
          position,
          manager_id
        ),
        parent:objectives!parent_objective_id (
          id,
          title,
          area
        )
      `)
      .eq('status', 'pending_validation')
      .eq('level', 'individual')
      .order('created_at', { ascending: true })

    // Filter to only team members
    pendingOKRs = (data || []).filter(okr =>
      (okr.owner as any)?.manager_id === user.id
    )
  }

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Validar OKRs" />

      <div className="p-6">
        <OKRValidationList
          pendingOKRs={pendingOKRs}
          profile={profile}
        />
      </div>
    </div>
  )
}
