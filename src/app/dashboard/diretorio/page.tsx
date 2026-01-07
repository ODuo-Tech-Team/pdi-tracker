import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { PeopleDirectory } from '@/components/diretorio/people-directory'
import { redirect } from 'next/navigation'

export default async function DiretorioPage() {
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

  // Get all active users
  const { data: people } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Get unique departments for filter
  const departments = [...new Set((people || [])
    .map(p => p.department)
    .filter(Boolean))]

  // Get unique positions for filter
  const positions = [...new Set((people || [])
    .map(p => p.position)
    .filter(Boolean))]

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Diretorio" />

      <div className="p-6">
        <PeopleDirectory
          people={people || []}
          departments={departments as string[]}
          positions={positions as string[]}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
