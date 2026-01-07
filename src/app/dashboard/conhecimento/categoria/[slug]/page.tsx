import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { CategoryView } from '@/components/conhecimento/category-view'
import { redirect, notFound } from 'next/navigation'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
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

  // Get category
  const { data: category } = await supabase
    .from('kb_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) {
    notFound()
  }

  // Get articles in this category
  const { data: articles } = await supabase
    .from('kb_articles')
    .select(`
      *,
      author:profiles!author_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  // Filter articles by department
  const filteredArticles = articles?.filter(art => {
    if (!art.department) return true
    if (art.department === profile?.department) return true
    if (profile?.role === 'admin') return true
    return false
  }) || []

  // Get all categories for navigation
  const { data: allCategories } = await supabase
    .from('kb_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  const canCreate = profile?.role !== 'colaborador'

  return (
    <div className="min-h-screen">
      <Header profile={profile} title="Base de Conhecimento" />

      <div className="p-6">
        <CategoryView
          category={category}
          articles={filteredArticles}
          allCategories={allCategories || []}
          profile={profile}
          canCreate={canCreate}
        />
      </div>
    </div>
  )
}
