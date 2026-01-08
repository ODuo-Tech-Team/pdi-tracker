'use client'

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
  AREA_LABELS,
  AreaType,
  OKR_STATUS_LABELS,
  OKRStatus,
} from '@/types/database'
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react'

export interface DashboardFilters {
  search: string
  area: AreaType | 'all'
  status: OKRStatus | 'all'
  scoreRange: 'all' | 'on-track' | 'at-risk' | 'off-track'
}

interface DashboardFiltersProps {
  filters: DashboardFilters
  onChange: (filters: DashboardFilters) => void
  showStatusFilter?: boolean
}

export function DashboardFiltersBar({
  filters,
  onChange,
  showStatusFilter = true,
}: DashboardFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.area !== 'all' ||
    filters.status !== 'all' ||
    filters.scoreRange !== 'all'

  const clearFilters = () => {
    onChange({
      search: '',
      area: 'all',
      status: 'all',
      scoreRange: 'all',
    })
  }

  return (
    <div className="flex flex-wrap gap-3 items-center p-4 bg-muted/30 rounded-lg">
      <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />

      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por titulo ou responsavel..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Area Filter */}
      <Select
        value={filters.area}
        onValueChange={(v) => onChange({ ...filters, area: v as AreaType | 'all' })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Areas</SelectItem>
          {Object.entries(AREA_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      {showStatusFilter && (
        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v as OKRStatus | 'all' })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(OKR_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Score Range Filter */}
      <Select
        value={filters.scoreRange}
        onValueChange={(v) =>
          onChange({
            ...filters,
            scoreRange: v as 'all' | 'on-track' | 'at-risk' | 'off-track',
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Progresso" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Scores</SelectItem>
          <SelectItem value="on-track">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              No caminho (7+)
            </div>
          </SelectItem>
          <SelectItem value="at-risk">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Em risco (4-6.9)
            </div>
          </SelectItem>
          <SelectItem value="off-track">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Fora do caminho (&lt;4)
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  )
}

// Helper function to filter objectives
export function filterObjectives<T extends { title: string; area?: string | null; status: string; current_score: number; owner?: { name: string } | null }>(
  objectives: T[],
  filters: DashboardFilters
): T[] {
  return objectives.filter((obj) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesTitle = obj.title.toLowerCase().includes(searchLower)
      const matchesOwner = obj.owner?.name?.toLowerCase().includes(searchLower)
      if (!matchesTitle && !matchesOwner) return false
    }

    // Area filter
    if (filters.area !== 'all' && obj.area !== filters.area) {
      return false
    }

    // Status filter
    if (filters.status !== 'all' && obj.status !== filters.status) {
      return false
    }

    // Score range filter
    if (filters.scoreRange !== 'all') {
      const score = obj.current_score
      if (filters.scoreRange === 'on-track' && score < 7) return false
      if (filters.scoreRange === 'at-risk' && (score < 4 || score >= 7)) return false
      if (filters.scoreRange === 'off-track' && score >= 4) return false
    }

    return true
  })
}
