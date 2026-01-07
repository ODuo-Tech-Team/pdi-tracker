import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { KnowledgeBase } from '@/components/conhecimento/knowledge-base'
import { redirect } from 'next/navigation'

export default async function ConhecimentoPage() {
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

  // Get categories
  const { data: categories } = await supabase
    .from('kb_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  // Get featured articles
  const { data: featuredArticles } = await supabase
    .from('kb_articles')
    .select(`
      *,
      author:profiles!author_id (
        id,
        name,
        avatar_url
      ),
      category:kb_categories!category_id (
        id,
        name,
        slug
      )
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(6)

  // Get recent articles
  const { data: recentArticles } = await supabase
    .from('kb_articles')
    .select(`
      *,
      author:profiles!author_id (
        id,
        name,
        avatar_url
      ),
      category:kb_categories!category_id (
        id,
        name,
        slug
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10)

  // Filter articles by department
  const filterArticles = (articles: any[]) => {
    return articles?.filter(art => {
      if (!art.department) return true
      if (art.department === profile?.department) return true
      if (profile?.role === 'admin') return true
      return false
    }) || []
  }

  const canCreate = profile?.role !== 'colaborador'

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Base de Conhecimento" />

      <div className="p-6">
        <KnowledgeBase
          categories={categories || []}
          featuredArticles={filterArticles(featuredArticles || [])}
          recentArticles={filterArticles(recentArticles || [])}
          profile={profile}
          canCreate={canCreate}
        />
      </div>
    </div>
  )
}
