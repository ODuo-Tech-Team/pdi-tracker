import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ArticleForm } from '@/components/conhecimento/article-form'
import { redirect } from 'next/navigation'

export default async function CreateArticlePage() {
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

  // Only gestor and admin can create articles
  if (profile?.role === 'colaborador') {
    redirect('/dashboard/conhecimento')
  }

  // Get categories
  const { data: categories } = await supabase
    .from('kb_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Base de Conhecimento" />

      <div className="p-6">
        <ArticleForm
          profile={profile}
          categories={categories || []}
        />
      </div>
    </div>
  )
}
