import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { AnnouncementDetail } from '@/components/comunicados/announcement-detail'
import { redirect, notFound } from 'next/navigation'

interface AnnouncementDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
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

  // Get announcement
  const { data: announcement, error } = await supabase
    .from('announcements')
    .select(`
      *,
      author:profiles!author_id (
        id,
        name,
        avatar_url,
        position
      )
    `)
    .eq('id', id)
    .single()

  if (error || !announcement) {
    notFound()
  }

  // Mark as read
  await supabase
    .from('announcement_reads')
    .upsert({
      announcement_id: id,
      user_id: user.id,
    })

  const canEdit = announcement.author_id === user.id || profile?.role === 'admin'

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Comunicado" />

      <div className="p-6">
        <AnnouncementDetail
          announcement={announcement}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}
