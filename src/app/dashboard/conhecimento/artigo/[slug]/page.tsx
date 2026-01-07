import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ArticleView } from '@/components/conhecimento/article-view'
import { redirect, notFound } from 'next/navigation'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
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

  // Get article
  const { data: article } = await supabase
    .from('kb_articles')
    .select(`
      *,
      author:profiles!author_id (
        id,
        name,
        avatar_url,
        role,
        department
      ),
      category:kb_categories!category_id (
        id,
        name,
        slug,
        color
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) {
    notFound()
  }

  // Check department access
  if (article.department && article.department !== profile?.department && profile?.role !== 'admin') {
    notFound()
  }

  // Increment view count
  await supabase
    .from('kb_articles')
    .update({ view_count: (article.view_count || 0) + 1 })
    .eq('id', article.id)

  // Get related articles from same category
  const { data: relatedArticles } = await supabase
    .from('kb_articles')
    .select(`
      id,
      title,
      slug,
      excerpt
    `)
    .eq('category_id', article.category_id)
    .eq('status', 'published')
    .neq('id', article.id)
    .limit(5)

  const canEdit = profile?.id === article.author_id || profile?.role === 'admin'

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Base de Conhecimento" />

      <div className="p-6">
        <ArticleView
          article={article}
          relatedArticles={relatedArticles || []}
          profile={profile}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}
