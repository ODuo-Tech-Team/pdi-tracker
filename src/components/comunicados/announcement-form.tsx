'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  AnnouncementCategory,
  ANNOUNCEMENT_SCOPE_LABELS,
  ANNOUNCEMENT_PRIORITY_LABELS,
  AnnouncementScope,
  AnnouncementPriority,
} from '@/types/database'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AnnouncementFormProps {
  profile: Profile | null
  categories: AnnouncementCategory[]
}

export function AnnouncementForm({ profile, categories }: AnnouncementFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [scope, setScope] = useState<AnnouncementScope>('company')
  const [priority, setPriority] = useState<AnnouncementPriority>('normal')
  const [isPinned, setIsPinned] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.error('Titulo e conteudo sao obrigatorios')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          author_id: profile?.id,
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || content.trim().substring(0, 150),
          scope,
          priority,
          department: scope === 'department' ? profile?.department : null,
          is_pinned: isPinned,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Comunicado publicado!')
      router.push(`/dashboard/comunicados/${data.id}`)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao publicar comunicado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/comunicados">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Comunicados
        </Button>
      </Link>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Novo Comunicado
            </CardTitle>
            <CardDescription>
              Crie um comunicado para a empresa, departamento ou sua equipe
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
                placeholder="Titulo do comunicado"
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Resumo (opcional)</Label>
              <Input
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Breve resumo que aparece na listagem"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Conteudo *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva o comunicado completo..."
                rows={10}
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visibilidade</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as AnnouncementScope)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ANNOUNCEMENT_SCOPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as AnnouncementPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ANNOUNCEMENT_PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pin */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Fixar no topo</Label>
                <p className="text-sm text-muted-foreground">
                  Comunicados fixados aparecem primeiro
                </p>
              </div>
              <Switch checked={isPinned} onCheckedChange={setIsPinned} />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Link href="/dashboard/comunicados" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Publicando...' : 'Publicar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
