import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { PersonProfile } from '@/components/diretorio/person-profile'
import { redirect, notFound } from 'next/navigation'

interface PersonProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function PersonProfilePage({ params }: PersonProfilePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get person profile
  const { data: person, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !person) {
    notFound()
  }

  // Get manager info if exists
  let manager = null
  if (person.manager_id) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, position, avatar_url')
      .eq('id', person.manager_id)
      .single()
    manager = data
  }

  // Get subordinates if person is a manager
  const { data: subordinates } = await supabase
    .from('profiles')
    .select('id, name, position, avatar_url')
    .eq('manager_id', id)
    .eq('is_active', true)
    .order('name')

  const isOwnProfile = user.id === id

  return (
    <div className="min-h-screen">
      <Header profile={currentProfile} title="Perfil" />

      <div className="p-6">
        <PersonProfile
          person={person}
          manager={manager}
          subordinates={subordinates || []}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  )
}
