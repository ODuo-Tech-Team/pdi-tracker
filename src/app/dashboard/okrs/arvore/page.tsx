import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { OKRTree } from '@/components/okrs/okr-tree'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function OKRTreePage() {
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

  // Get active cycle
  const { data: activeCycle } = await supabase
    .from('okr_cycles')
    .select('*')
    .eq('is_active', true)
    .single()

  // Get all objectives with owners and key results
  const { data: allObjectives } = await supabase
    .from('objectives')
    .select(`
      *,
      owner:profiles!owner_id(*),
      key_results (*)
    `)
    .eq('cycle_id', activeCycle?.id || '')
    .order('level', { ascending: true })
    .order('area', { ascending: true })

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Arvore de OKRs" />

      <div className="p-6 space-y-4">
        {/* Back button */}
        <Link href="/dashboard/okrs">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para OKRs
          </Button>
        </Link>

        <OKRTree
          objectives={allObjectives || []}
          cycle={activeCycle}
        />
      </div>
    </div>
  )
}
