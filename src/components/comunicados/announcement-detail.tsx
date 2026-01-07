'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AnnouncementWithDetails,
  ANNOUNCEMENT_PRIORITY_LABELS,
  ANNOUNCEMENT_PRIORITY_COLORS,
  ANNOUNCEMENT_SCOPE_LABELS,
} from '@/types/database'
import { ArrowLeft, Pin, Edit, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AnnouncementDetailProps {
  announcement: AnnouncementWithDetails
  canEdit: boolean
}

export function AnnouncementDetail({ announcement, canEdit }: AnnouncementDetailProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/dashboard/comunicados">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Comunicados
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {announcement.is_pinned && (
                  <Pin className="h-5 w-5 text-[#F58300]" />
                )}
                <Badge
                  style={{
                    backgroundColor: ANNOUNCEMENT_PRIORITY_COLORS[announcement.priority],
                    color: 'white',
                  }}
                >
                  {ANNOUNCEMENT_PRIORITY_LABELS[announcement.priority]}
                </Badge>
                <Badge variant="outline">
                  {ANNOUNCEMENT_SCOPE_LABELS[announcement.scope]}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{announcement.title}</CardTitle>
            </div>
            {canEdit && (
              <Link href={`/dashboard/comunicados/${announcement.id}/editar`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pb-4 border-b">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {(announcement.author as any)?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <span>{(announcement.author as any)?.name}</span>
              {(announcement.author as any)?.position && (
                <>
                  <span>-</span>
                  <span>{(announcement.author as any)?.position}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(announcement.published_at), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            {announcement.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Expiration */}
          {announcement.expires_at && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Este comunicado expira em{' '}
                {format(new Date(announcement.expires_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
