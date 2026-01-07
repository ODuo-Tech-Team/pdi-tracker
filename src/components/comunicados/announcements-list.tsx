'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Profile,
  AnnouncementWithDetails,
  AnnouncementCategory,
  ANNOUNCEMENT_PRIORITY_LABELS,
  ANNOUNCEMENT_PRIORITY_COLORS,
  AnnouncementPriority,
} from '@/types/database'
import {
  Plus,
  Pin,
  Search,
  Bell,
  CheckCircle,
  Circle,
  Megaphone,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface AnnouncementsListProps {
  announcements: (AnnouncementWithDetails & { is_read?: boolean })[]
  categories: AnnouncementCategory[]
  profile: Profile | null
  canCreate: boolean
}

export function AnnouncementsList({
  announcements,
  categories,
  profile,
  canCreate,
}: AnnouncementsListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = search === '' ||
      ann.title.toLowerCase().includes(search.toLowerCase()) ||
      ann.content.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  const unreadCount = announcements.filter(a => !a.is_read).length

  const handleMarkAsRead = async (announcementId: string) => {
    await supabase
      .from('announcement_reads')
      .upsert({
        announcement_id: announcementId,
        user_id: profile?.id,
      })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Comunicados
          </h2>
          <p className="text-muted-foreground">
            {announcements.length} comunicado(s), {unreadCount} nao lido(s)
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/comunicados/criar">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Comunicado
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar comunicados..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Announcements */}
      <div className="space-y-4">
        {filteredAnnouncements.map((ann) => (
          <Card
            key={ann.id}
            className={cn(
              'cursor-pointer hover:shadow-md transition-shadow',
              !ann.is_read && 'border-l-4 border-l-[#F58300]'
            )}
            onClick={() => handleMarkAsRead(ann.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {ann.is_pinned && (
                    <Pin className="h-5 w-5 text-[#F58300] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!ann.is_read && (
                        <Circle className="h-2 w-2 fill-[#F58300] text-[#F58300]" />
                      )}
                      <Badge
                        style={{
                          backgroundColor: ANNOUNCEMENT_PRIORITY_COLORS[ann.priority],
                          color: 'white',
                        }}
                      >
                        {ANNOUNCEMENT_PRIORITY_LABELS[ann.priority]}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{ann.title}</CardTitle>
                    {ann.excerpt && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {ann.excerpt}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(ann.published_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {(ann.author as any)?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {(ann.author as any)?.name}
                  </span>
                </div>
                <Link href={`/dashboard/comunicados/${ann.id}`}>
                  <Button variant="ghost" size="sm">
                    Ler mais
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAnnouncements.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum comunicado</h3>
              <p className="text-muted-foreground">
                {search
                  ? 'Nenhum comunicado encontrado com essa busca.'
                  : 'Nao ha comunicados disponiveis no momento.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
