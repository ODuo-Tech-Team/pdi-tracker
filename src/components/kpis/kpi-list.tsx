'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Profile,
  KPIWithValues,
  Objective,
  AREA_LABELS,
  AreaType,
} from '@/types/database'
import { Plus, Search, Filter } from 'lucide-react'
import { KPICard } from './kpi-card'
import { KPIFormDialog } from './kpi-form'

interface KPIListProps {
  kpis: KPIWithValues[]
  profile: Profile | null
  objectives: Pick<Objective, 'id' | 'title' | 'area'>[]
}

export function KPIList({ kpis, profile, objectives }: KPIListProps) {
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const filteredKPIs = kpis.filter(kpi => {
    const matchesSearch = kpi.title.toLowerCase().includes(search.toLowerCase())
    const matchesArea = areaFilter === 'all' || kpi.area === areaFilter
    return matchesSearch && matchesArea
  })

  const myKPIs = filteredKPIs.filter(kpi => kpi.owner_id === profile?.id)
  const areaKPIs = filteredKPIs.filter(kpi => kpi.owner_id !== profile?.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KPIs</h1>
          <p className="text-muted-foreground">
            Acompanhe seus indicadores de performance
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2 bg-[#F58300] hover:bg-[#e07600]">
          <Plus className="h-4 w-4" />
          Novo KPI
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar KPIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Areas</SelectItem>
            {Object.entries(AREA_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* My KPIs */}
      {myKPIs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Meus KPIs</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myKPIs.map((kpi) => (
              <KPICard key={kpi.id} kpi={kpi} isOwner={true} profile={profile} objectives={objectives} />
            ))}
          </div>
        </div>
      )}

      {/* Area KPIs */}
      {areaKPIs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">KPIs da Area</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {areaKPIs.map((kpi) => (
              <KPICard key={kpi.id} kpi={kpi} isOwner={false} profile={profile} objectives={objectives} />
            ))}
          </div>
        </div>
      )}

      {filteredKPIs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search || areaFilter !== 'all'
              ? 'Nenhum KPI encontrado com os filtros selecionados.'
              : 'Voce ainda nao possui nenhum KPI. Crie seu primeiro KPI!'}
          </p>
        </div>
      )}

      {/* Create KPI Dialog */}
      <KPIFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        profile={profile}
        objectives={objectives}
      />
    </div>
  )
}
