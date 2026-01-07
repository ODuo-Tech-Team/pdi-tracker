'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Profile,
  KBCategory,
  KBArticle,
} from '@/types/database'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Eye,
  Clock,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ArticleViewProps {
  article: KBArticle & {
    author: Pick<Profile, 'id' | 'name' | 'avatar_url' | 'role' | 'department'> | null
    category: Pick<KBCategory, 'id' | 'name' | 'slug' | 'color'> | null
  }
  relatedArticles: {
    id: string
    title: string
    slug: string
    excerpt: string | null
  }[]
  profile: Profile | null
  canEdit: boolean
}

export function ArticleView({
  article,
  relatedArticles,
  profile,
  canEdit,
}: ArticleViewProps) {
  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold mt-6 mb-3">{line.slice(4)}</h3>
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold mt-8 mb-4">{line.slice(3)}</h2>
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-8 mb-4">{line.slice(2)}</h1>
      }

      // Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={index} className="ml-6 list-disc">{line.slice(2)}</li>
      }
      if (/^\d+\. /.test(line)) {
        return <li key={index} className="ml-6 list-decimal">{line.replace(/^\d+\. /, '')}</li>
      }

      // Bold and italic
      let processedLine = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')

      // Empty lines
      if (line.trim() === '') {
        return <br key={index} />
      }

      return (
        <p
          key={index}
          className="mb-4"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      )
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/conhecimento">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Base de Conhecimento
          </Button>
        </Link>

        {canEdit && (
          <Link href={`/dashboard/conhecimento/editar/${article.slug}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Article header */}
      <div>
        {article.category && (
          <Link href={`/dashboard/conhecimento/categoria/${article.category.slug}`}>
            <Badge
              className="mb-4"
              style={{ backgroundColor: article.category.color || undefined }}
            >
              {article.category.name}
            </Badge>
          </Link>
        )}

        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

        {article.excerpt && (
          <p className="text-lg text-muted-foreground mb-6">{article.excerpt}</p>
        )}

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          {article.author && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={article.author.avatar_url || ''} />
                <AvatarFallback>
                  {article.author.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium text-foreground">{article.author.name}</span>
                <span className="block text-xs capitalize">{article.author.department}</span>
              </div>
            </div>
          )}

          {article.published_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(article.published_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          )}

          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {article.view_count || 0} visualizacoes
          </div>

          {article.read_time_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.read_time_minutes} min de leitura
            </div>
          )}
        </div>
      </div>

      {/* Cover image */}
      {article.cover_image && (
        <div className="rounded-lg overflow-hidden">
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <Separator />

      {/* Article content */}
      <Card>
        <CardContent className="p-8 prose prose-slate max-w-none">
          {renderContent(article.content)}
        </CardContent>
      </Card>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag: string) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Artigos Relacionados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/dashboard/conhecimento/artigo/${related.slug}`}
                className="block"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{related.title}</p>
                    {related.excerpt && (
                      <p className="text-sm text-muted-foreground truncate">
                        {related.excerpt}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
