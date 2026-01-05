import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { MetaDetail } from '@/components/metas/meta-detail'
import { notFound } from 'next/navigation'

interface MetaDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MetaDetailPage({ params }: MetaDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: goal, error } = await supabase
    .from('goals')
    .select(`
      *,
      comments (
        id,
        content,
        created_at,
        user_id,
        profiles (name, role)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !goal) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Detalhe da Meta" />

      <div className="p-6">
        <MetaDetail goal={goal} profile={profile} />
      </div>
    </div>
  )
}
