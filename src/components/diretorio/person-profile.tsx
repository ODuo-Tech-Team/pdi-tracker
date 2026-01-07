'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Profile,
  ROLE_LABELS,
  AREA_LABELS,
  AreaType,
} from '@/types/database'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Users,
  User,
  Calendar,
  MapPin,
  Linkedin,
  Edit,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PersonProfileProps {
  person: Profile
  manager: { id: string; name: string; position: string | null; avatar_url: string | null } | null
  subordinates: { id: string; name: string; position: string | null; avatar_url: string | null }[]
  isOwnProfile: boolean
}

export function PersonProfile({
  person,
  manager,
  subordinates,
  isOwnProfile,
}: PersonProfileProps) {
  const extendedPerson = person as any

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/diretorio">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Diretorio
        </Button>
      </Link>

      {/* Main Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar + Basic Info */}
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarFallback className="text-4xl bg-[#043F8D] text-white">
                  {person.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Link href="/dashboard/configuracoes">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                </Link>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">{person.name}</h1>
                {person.position && (
                  <p className="text-lg text-muted-foreground">{person.position}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="capitalize">
                    {ROLE_LABELS[person.role]}
                  </Badge>
                  {extendedPerson.area && (
                    <Badge variant="outline">
                      {AREA_LABELS[extendedPerson.area as AreaType]}
                    </Badge>
                  )}
                </div>
              </div>

              {extendedPerson.bio && (
                <p className="text-muted-foreground">{extendedPerson.bio}</p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${person.email}`} className="hover:underline">
                    {person.email}
                  </a>
                </div>
                {extendedPerson.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{extendedPerson.phone}</span>
                  </div>
                )}
                {person.department && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{person.department}</span>
                  </div>
                )}
                {extendedPerson.office_location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{extendedPerson.office_location}</span>
                  </div>
                )}
                {extendedPerson.hire_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Desde {format(new Date(extendedPerson.hire_date), "MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
                {extendedPerson.linkedin_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={extendedPerson.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-600"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
              </div>

              {/* Skills */}
              {extendedPerson.skills?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Habilidades</p>
                  <div className="flex flex-wrap gap-1">
                    {extendedPerson.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Manager */}
        {manager && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Gestor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/diretorio/${manager.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <Avatar>
                    <AvatarFallback>
                      {manager.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{manager.name}</p>
                    {manager.position && (
                      <p className="text-sm text-muted-foreground">
                        {manager.position}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Subordinates */}
        {subordinates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipe ({subordinates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {subordinates.map((sub) => (
                  <Link key={sub.id} href={`/dashboard/diretorio/${sub.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {sub.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{sub.name}</p>
                        {sub.position && (
                          <p className="text-xs text-muted-foreground">
                            {sub.position}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
