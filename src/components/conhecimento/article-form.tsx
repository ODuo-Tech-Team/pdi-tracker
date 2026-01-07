'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Profile,
  KBCategory,
  DEPARTMENT_LABELS,
  DepartmentType,
} from '@/types/database'
import { ArrowLeft, FileText, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ArticleFormProps {
  profile: Profile | null
  categories: KBCategory[]
  article?: {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string | null
    category_id: string | null
    department: string | null
    is_featured: boolean
    cover_image: string | null
    tags: string[] | null
  }
}

export function ArticleForm({ profile, categories, article }: ArticleFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const defaultCategoryId = searchParams.get('categoria') || article?.category_id || ''

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(article?.title || '')
  const [content, setContent] = useState(article?.content || '')
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [department, setDepartment] = useState<string>(article?.department || '')
  const [isFeatured, setIsFeatured] = useState(article?.is_featured || false)
  const [coverImage, setCoverImage] = useState(article?.cover_image || '')
  const [tagsInput, setTagsInput] = useState(article?.tags?.join(', ') || '')
  const [preview, setPreview] = useState(false)

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200
    const words = text.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(words / wordsPerMinute))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.error('Titulo e conteudo sao obrigatorios')
      return
    }

    if (!categoryId) {
      toast.error('Selecione uma categoria')
      return
    }

    setLoading(true)

    try {
      const slug = article?.slug || generateSlug(title)
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const articleData = {
        title: title.trim(),
        slug,
        content: content.trim(),
        excerpt: excerpt.trim() || content.trim().substring(0, 200),
        category_id: categoryId,
        author_id: profile?.id,
        department: department || null,
        is_featured: isFeatured,
        cover_image: coverImage.trim() || null,
        tags: tags.length > 0 ? tags : null,
        read_time_minutes: calculateReadTime(content),
        status: 'published' as const,
        published_at: new Date().toISOString(),
      }

      if (article?.id) {
        const { error } = await supabase
          .from('kb_articles')
          .update(articleData)
          .eq('id', article.id)

        if (error) throw error
        toast.success('Artigo atualizado!')
      } else {
        const { data, error } = await supabase
          .from('kb_articles')
          .insert(articleData)
          .select()
          .single()

        if (error) throw error
        toast.success('Artigo publicado!')
        router.push(`/dashboard/conhecimento/artigo/${data.slug}`)
        return
      }

      router.push(`/dashboard/conhecimento/artigo/${slug}`)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar artigo')
    } finally {
      setLoading(false)
    }
  }

  // Simple markdown preview
  const renderPreview = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={index} className="ml-6 list-disc">{line.slice(2)}</li>
      }
      if (line.trim() === '') {
        return <br key={index} />
      }
      return <p key={index} className="mb-3">{line}</p>
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/conhecimento">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Base de Conhecimento
        </Button>
      </Link>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {article ? 'Editar Artigo' : 'Novo Artigo'}
            </CardTitle>
            <CardDescription>
              Crie um artigo para a base de conhecimento da empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titulo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titulo do artigo"
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Resumo</Label>
              <Input
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Breve resumo do artigo"
              />
            </div>

            {/* Category and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibilidade por Departamento</Label>
                <Select value={department || 'all'} onValueChange={(v) => setDepartment(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos (padrao)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        Apenas {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="cover">URL da Imagem de Capa</Label>
              <Input
                id="cover"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por virgula)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="onboarding, rh, processos"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Conteudo * (Markdown)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview(!preview)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {preview ? 'Editar' : 'Preview'}
                </Button>
              </div>

              {preview ? (
                <Card className="p-6 min-h-[400px] prose prose-slate max-w-none">
                  {renderPreview(content)}
                </Card>
              ) : (
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva o conteudo do artigo usando Markdown...

# Titulo Principal

## Subtitulo

Paragrafo de texto normal.

- Item de lista
- Outro item

**Texto em negrito** e *texto em italico*"
                  rows={20}
                  className="font-mono text-sm"
                />
              )}
            </div>

            {/* Featured */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Artigo em Destaque</Label>
                <p className="text-sm text-muted-foreground">
                  Artigos em destaque aparecem na pagina inicial
                </p>
              </div>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Link href="/dashboard/conhecimento" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Salvando...' : article ? 'Salvar Alteracoes' : 'Publicar Artigo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
