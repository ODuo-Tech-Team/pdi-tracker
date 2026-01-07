'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Profile,
  OKRCycle,
  ObjectiveWithKRs,
  OKR_LEVEL_LABELS,
  OKR_STATUS_LABELS,
  AREA_LABELS,
  AREA_COLORS,
  AreaType,
} from '@/types/database'
import {
  Building2,
  Users,
  User,
  Plus,
  ChevronRight,
  Target,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { OKRCard } from './okr-card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface OKRDashboardProps {
  profile: Profile | null
  activeCycle: OKRCycle | null
  companyOKRs: ObjectiveWithKRs[]
  areaOKRs: ObjectiveWithKRs[]
  myOKR: ObjectiveWithKRs | null
}

export function OKRDashboard({
  profile,
  activeCycle,
  companyOKRs,
  areaOKRs,
  myOKR,
}: OKRDashboardProps) {
  const [selectedArea, setSelectedArea] = useState<AreaType | 'all'>('all')

  const filteredAreaOKRs = selectedArea === 'all'
    ? areaOKRs
    : areaOKRs.filter(okr => okr.area === selectedArea)

  const userArea = profile?.area as AreaType | null
  const userAreaOKR = areaOKRs.find(okr => okr.area === userArea)

  // Calculate overall company progress
  const companyProgress = companyOKRs.length > 0
    ? companyOKRs.reduce((acc, okr) => acc + okr.current_score, 0) / companyOKRs.length
    : 0

  if (!activeCycle) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum ciclo de OKR ativo</h3>
          <p className="text-muted-foreground">
            Entre em contato com o administrador para configurar o ciclo de OKRs.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cycle Info + Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ciclo Ativo</CardDescription>
            <CardTitle className="text-xl">{activeCycle.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(activeCycle.start_date), "dd MMM", { locale: ptBR })} -{' '}
                {format(new Date(activeCycle.end_date), "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progresso Empresa</CardDescription>
            <CardTitle className="text-xl">{companyProgress.toFixed(1)}/10</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={companyProgress * 10} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>OKRs Empresa</CardDescription>
            <CardTitle className="text-xl">{companyOKRs.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Objetivos estrategicos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>OKRs por Area</CardDescription>
            <CardTitle className="text-xl">{areaOKRs.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>6 areas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My OKR Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Meu OKR Individual
              </CardTitle>
              <CardDescription>
                Seu objetivo pessoal alinhado com a area
              </CardDescription>
            </div>
            {!myOKR && (
              <Link href="/dashboard/okrs/criar">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Meu OKR
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {myOKR ? (
            <OKRCard objective={myOKR} showDetails />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Voce ainda nao criou seu OKR individual para este ciclo.</p>
              <p className="text-sm mt-1">
                Crie seu OKR vinculado a area de{' '}
                <span className="font-medium">{userArea ? AREA_LABELS[userArea] : 'sua area'}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Company / Areas */}
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="areas" className="gap-2">
            <Users className="h-4 w-4" />
            Areas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {companyOKRs.map((okr) => (
              <OKRCard key={okr.id} objective={okr} />
            ))}
          </div>
          {companyOKRs.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum OKR de empresa cadastrado para este ciclo.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          {/* Area Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedArea === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedArea('all')}
            >
              Todas
            </Button>
            {Object.entries(AREA_LABELS).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedArea === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedArea(key as AreaType)}
                style={{
                  backgroundColor: selectedArea === key ? AREA_COLORS[key as AreaType] : undefined,
                  borderColor: AREA_COLORS[key as AreaType],
                  color: selectedArea === key ? 'white' : AREA_COLORS[key as AreaType],
                }}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredAreaOKRs.map((okr) => (
              <OKRCard key={okr.id} objective={okr} showArea />
            ))}
          </div>
          {filteredAreaOKRs.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum OKR de area encontrado.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
