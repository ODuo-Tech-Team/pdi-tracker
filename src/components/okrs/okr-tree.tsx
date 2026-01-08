'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  ObjectiveWithKRs,
  Profile,
  OKRCycle,
  AREA_LABELS,
  AreaType,
} from '@/types/database'
import { OKRTreeNode } from './okr-tree-node'
import {
  GitBranch,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface OKRTreeProps {
  objectives: (ObjectiveWithKRs & {
    owner?: Profile
    children?: (ObjectiveWithKRs & { owner?: Profile; children?: any[] })[]
  })[]
  cycle: OKRCycle | null
}

export function OKRTree({ objectives, cycle }: OKRTreeProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [areaFilter, setAreaFilter] = useState<AreaType | 'all'>('all')
  const [expandAll, setExpandAll] = useState(false)
  const [zoom, setZoom] = useState(100)

  // Organize objectives into tree structure
  const treeData = useMemo(() => {
    // First, get all company-level objectives as roots
    const roots = objectives.filter(o => o.level === 'company')

    // Build tree recursively
    const buildTree = (
      parent: ObjectiveWithKRs & { owner?: Profile }
    ): ObjectiveWithKRs & { owner?: Profile; children?: any[] } => {
      const children = objectives.filter(
        o => o.parent_objective_id === parent.id
      )
      return {
        ...parent,
        children: children.map(child => buildTree(child)),
      }
    }

    return roots.map(root => buildTree(root))
  }, [objectives])

  // Filter tree based on search and area
  const filteredTree = useMemo(() => {
    if (!searchTerm && areaFilter === 'all') return treeData

    const matchesFilter = (obj: ObjectiveWithKRs & { owner?: Profile }): boolean => {
      const matchesSearch =
        !searchTerm ||
        obj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (obj.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      const matchesArea = areaFilter === 'all' || obj.area === areaFilter

      return matchesSearch && matchesArea
    }

    const filterTree = (
      node: ObjectiveWithKRs & { children?: any[] }
    ): (ObjectiveWithKRs & { children?: any[] }) | null => {
      const filteredChildren = node.children
        ?.map(child => filterTree(child))
        .filter(Boolean) as any[]

      if (matchesFilter(node) || (filteredChildren && filteredChildren.length > 0)) {
        return {
          ...node,
          children: filteredChildren,
        }
      }

      return null
    }

    return treeData
      .map(root => filterTree(root))
      .filter(Boolean) as typeof treeData
  }, [treeData, searchTerm, areaFilter])

  // Stats
  const stats = useMemo(() => {
    const allNodes = objectives
    const companyCount = allNodes.filter(o => o.level === 'company').length
    const areaCount = allNodes.filter(o => o.level === 'area').length
    const individualCount = allNodes.filter(o => o.level === 'individual' || o.level === 'head').length
    const avgScore =
      allNodes.length > 0
        ? allNodes.reduce((sum, o) => sum + o.current_score, 0) / allNodes.length
        : 0

    return { companyCount, areaCount, individualCount, avgScore, total: allNodes.length }
  }, [objectives])

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Arvore de OKRs
              </CardTitle>
              {cycle && (
                <CardDescription>
                  {cycle.name} - {stats.total} objetivos
                </CardDescription>
              )}
            </div>

            {/* Stats badges */}
            <div className="flex gap-2 text-sm">
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                {stats.companyCount} Empresa
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {stats.areaCount} Areas
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                {stats.individualCount} Individuais
              </div>
              <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                Media: {stats.avgScore.toFixed(1)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar OKR ou responsavel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={areaFilter}
              onValueChange={(v) => setAreaFilter(v as AreaType | 'all')}
            >
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
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

            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                disabled={zoom >= 150}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(100)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandAll(!expandAll)}
            >
              {expandAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expandir
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tree View */}
      <div
        className="p-4 bg-muted/30 rounded-lg min-h-[400px] overflow-auto"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
        }}
      >
        {filteredTree.length > 0 ? (
          <div className="space-y-4">
            {filteredTree.map((root) => (
              <OKRTreeNode key={root.id} objective={root} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {searchTerm || areaFilter !== 'all'
              ? 'Nenhum OKR encontrado com os filtros aplicados.'
              : 'Nenhum OKR cadastrado neste ciclo.'}
          </div>
        )}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>No caminho (7-10)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Em risco (4-6.9)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Fora do caminho (0-3.9)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
