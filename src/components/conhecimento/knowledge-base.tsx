'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Profile,
  KBCategory,
  KBArticle,
} from '@/types/database'
import {
  Search,
  Plus,
  BookOpen,
  FileText,
  Star,
  Clock,
  Eye,
  ChevronRight,
  Folder,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface KnowledgeBaseProps {
  categories: KBCategory[]
  featuredArticles: (KBArticle & {
    author: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
    category: Pick<KBCategory, 'id' | 'name' | 'slug'> | null
  })[]
  recentArticles: (KBArticle & {
    author: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
    category: Pick<KBCategory, 'id' | 'name' | 'slug'> | null
  })[]
  profile: Profile | null
  canCreate: boolean
}

export function KnowledgeBase({
  categories,
  featuredArticles,
  recentArticles,
  profile,
  canCreate,
}: KnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const getCategoryIcon = (iconName: string | null) => {
    switch (iconName) {
      case 'folder':
        return Folder
      case 'file':
        return FileText
      default:
        return BookOpen
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Base de Conhecimento</h2>
          <p className="text-muted-foreground">
            Documentos, guias e tutoriais da empresa
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {canCreate && (
            <Link href="/dashboard/conhecimento/criar">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Artigo
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div>
        <h3 className="font-semibold mb-4">Categorias</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const IconComponent = getCategoryIcon(category.icon)
            return (
              <Link
                key={category.id}
                href={`/dashboard/conhecimento/categoria/${category.slug}`}
              >
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color || '#e5e7eb' }}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Artigos em Destaque</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} featured />
            ))}
          </div>
        </div>
      )}

      {/* Recent Articles */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Artigos Recentes</h3>
        </div>
        <div className="space-y-3">
          {recentArticles.map((article) => (
            <ArticleRow key={article.id} article={article} />
          ))}
        </div>

        {recentArticles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum artigo publicado ainda
              </p>
              {canCreate && (
                <Link href="/dashboard/conhecimento/criar">
                  <Button className="mt-4">Criar Primeiro Artigo</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function ArticleCard({
  article,
  featured,
}: {
  article: KnowledgeBaseProps['featuredArticles'][0]
  featured?: boolean
}) {
  return (
    <Link href={`/dashboard/conhecimento/artigo/${article.slug}`}>
      <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
        {article.cover_image && (
          <div className="h-32 bg-muted overflow-hidden rounded-t-lg">
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            {article.category && (
              <Badge variant="secondary" className="text-xs">
                {article.category.name}
              </Badge>
            )}
            {featured && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          <CardTitle className="text-base line-clamp-2">{article.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {article.author && (
                <>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={article.author.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {article.author.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{article.author.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.view_count || 0}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ArticleRow({
  article,
}: {
  article: KnowledgeBaseProps['recentArticles'][0]
}) {
  return (
    <Link href={`/dashboard/conhecimento/artigo/${article.slug}`}>
      <Card className="hover:border-primary/50 transition-all cursor-pointer">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{article.title}</h4>
              {article.category && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {article.category.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {article.author && <span>{article.author.name}</span>}
              {article.published_at && (
                <span>
                  {formatDistanceToNow(new Date(article.published_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.view_count || 0} visualizacoes
              </span>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}
