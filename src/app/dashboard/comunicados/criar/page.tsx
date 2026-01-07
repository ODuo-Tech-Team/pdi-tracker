import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { AnnouncementForm } from '@/components/comunicados/announcement-form'
import { redirect } from 'next/navigation'

export default async function CriarComunicadoPage() {
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

  // Only managers and admins can create
  if (profile?.role === 'colaborador') {
    redirect('/dashboard/comunicados')
  }

  // Get categories
  const { data: categories } = await supabase
    .from('announcement_categories')
    .select('*')
    .order('name')

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Novo Comunicado" />

      <div className="p-6">
        <AnnouncementForm
          profile={profile}
          categories={categories || []}
        />
      </div>
    </div>
  )
}
