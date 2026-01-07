import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { CalendarView } from '@/components/calendario/calendar-view'
import { redirect } from 'next/navigation'
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'

export default async function CalendarioPage() {
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

  // Get events for current month +/- 1 month
  const now = new Date()
  const rangeStart = subMonths(startOfMonth(now), 1)
  const rangeEnd = addMonths(endOfMonth(now), 1)

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      creator:profiles!creator_id (
        id,
        name,
        avatar_url
      ),
      invitees:event_invitees (
        id,
        user_id,
        rsvp_status,
        user:profiles!user_id (
          id,
          name,
          avatar_url
        )
      )
    `)
    .gte('start_time', rangeStart.toISOString())
    .lte('start_time', rangeEnd.toISOString())
    .order('start_time', { ascending: true })

  // Filter events by visibility
  const filteredEvents = (events || []).filter(event => {
    if (event.visibility === 'company') return true
    if (event.creator_id === user.id) return true
    if (event.visibility === 'department' && event.department === profile?.department) return true
    if (event.visibility === 'team') {
      if (event.creator_id === profile?.manager_id) return true
      const isInvited = event.invitees?.some((inv: any) => inv.user_id === user.id)
      if (isInvited) return true
    }
    if (event.visibility === 'private') {
      const isInvited = event.invitees?.some((inv: any) => inv.user_id === user.id)
      if (isInvited) return true
    }
    return false
  })

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Calendario" />

      <div className="p-6">
        <CalendarView
          events={filteredEvents}
          profile={profile}
        />
      </div>
    </div>
  )
}
