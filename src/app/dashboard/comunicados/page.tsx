import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { AnnouncementsList } from '@/components/comunicados/announcements-list'
import { redirect } from 'next/navigation'

export default async function ComunicadosPage() {
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

  // Get announcements (with visibility filter)
  const { data: announcements } = await supabase
    .from('announcements')
    .select(`
      *,
      author:profiles!author_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq('is_published', true)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })

  // Filter by scope
  const filteredAnnouncements = (announcements || []).filter(ann => {
    if (ann.scope === 'company') return true
    if (ann.scope === 'department' && ann.department === profile?.department) return true
    if (ann.scope === 'team' && ann.author_id === profile?.manager_id) return true
    return false
  })

  // Get user's read announcements
  const { data: reads } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', user.id)

  const readIds = new Set(reads?.map(r => r.announcement_id) || [])

  // Mark announcements with read status
  const announcementsWithReadStatus = filteredAnnouncements.map(ann => ({
    ...ann,
    is_read: readIds.has(ann.id)
  }))

  // Get categories
  const { data: categories } = await supabase
    .from('announcement_categories')
    .select('*')
    .order('name')

  const canCreate = profile?.role !== 'colaborador'

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Comunicados" />

      <div className="p-6">
        <AnnouncementsList
          announcements={announcementsWithReadStatus}
          categories={categories || []}
          profile={profile}
          canCreate={canCreate}
        />
      </div>
    </div>
  )
}
