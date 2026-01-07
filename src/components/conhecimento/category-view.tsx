'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Profile,
  KBCategory,
  KBArticle,
} from '@/types/database'
import {
  ArrowLeft,
  Plus,
  FileText,
  Eye,
  ChevronRight,
  Folder,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface CategoryViewProps {
  category: KBCategory
  articles: (KBArticle & {
    author: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
  })[]
  allCategories: KBCategory[]
  profile: Profile | null
  canCreate: boolean
}

export function CategoryView({
  category,
  articles,
  allCategories,
  profile,
  canCreate,
}: CategoryViewProps) {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/dashboard/conhecimento">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Base de Conhecimento
        </Button>
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar with categories */}
        <div className="lg:w-64 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {allCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/dashboard/conhecimento/categoria/${cat.slug}`}
                >
                  <div
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                      cat.id === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Folder className="h-4 w-4" />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Category header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: category.color || '#e5e7eb' }}
                >
                  <Folder className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{category.name}</h1>
                  {category.description && (
                    <p className="text-muted-foreground">{category.description}</p>
                  )}
                </div>
              </div>
            </div>

            {canCreate && (
              <Link href={`/dashboard/conhecimento/criar?categoria=${category.id}`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Artigo
                </Button>
              </Link>
            )}
          </div>

          {/* Articles list */}
          <div className="space-y-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/dashboard/conhecimento/artigo/${article.slug}`}
              >
                <Card className="hover:border-primary/50 transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-start gap-4">
                    {article.cover_image ? (
                      <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden shrink-0">
                        <img
                          src={article.cover_image}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{article.title}</h3>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {article.author && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={article.author.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {article.author.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{article.author.name}</span>
                          </div>
                        )}
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
                          {article.view_count || 0}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                  </CardContent>
                </Card>
              </Link>
            ))}

            {articles.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhum artigo nesta categoria
                  </p>
                  {canCreate && (
                    <Link href={`/dashboard/conhecimento/criar?categoria=${category.id}`}>
                      <Button>Criar Primeiro Artigo</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
