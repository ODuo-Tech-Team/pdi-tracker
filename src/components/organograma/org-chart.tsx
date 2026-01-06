'use client'

import { useState } from 'react'
import { OrgChartNode, ROLE_LABELS } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronDown, ChevronRight, User, Users, Mail, Building, Briefcase } from 'lucide-react'

interface OrgChartProps {
  tree: OrgChartNode[]
  currentUserId: string
  isAdmin: boolean
}

interface OrgNodeProps {
  node: OrgChartNode
  level: number
  currentUserId: string
  isAdmin: boolean
  onSelect: (node: OrgChartNode) => void
}

function OrgNode({ node, level, currentUserId, isAdmin, onSelect }: OrgNodeProps) {
  const [expanded, setExpanded] = useState(level < 2)
  const hasSubordinates = node.subordinates.length > 0

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200'
      case 'gestor': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const isCurrentUser = node.id === currentUserId

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={`
          relative cursor-pointer transition-all duration-200
          ${isCurrentUser ? 'ring-2 ring-[#F58300] ring-offset-2' : ''}
        `}
        onClick={() => onSelect(node)}
      >
        <Card className="w-48 border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            {/* Avatar */}
            <div className={`
              w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-xl mb-3
              ${node.role === 'admin' ? 'bg-red-500' : node.role === 'gestor' ? 'bg-[#043F8D]' : 'bg-gray-400'}
            `}>
              {node.name.charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <h3 className="font-semibold text-gray-900 truncate" title={node.name}>
              {node.name}
            </h3>

            {/* Position */}
            {node.position && (
              <p className="text-xs text-gray-500 truncate mt-1" title={node.position}>
                {node.position}
              </p>
            )}

            {/* Role Badge */}
            <Badge className={`mt-2 ${getRoleBadgeColor(node.role)}`}>
              {ROLE_LABELS[node.role]}
            </Badge>

            {/* Subordinates count */}
            {hasSubordinates && (
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
                <Users className="h-3 w-3" />
                <span>{node.subordinates.length} {node.subordinates.length === 1 ? 'liderado' : 'liderados'}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expand/Collapse button */}
        {hasSubordinates && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 z-10"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        )}
      </div>

      {/* Connector line down */}
      {hasSubordinates && expanded && (
        <div className="w-px h-8 bg-gray-300" />
      )}

      {/* Subordinates */}
      {hasSubordinates && expanded && (
        <div className="relative">
          {/* Horizontal connector line */}
          {node.subordinates.length > 1 && (
            <div
              className="absolute top-0 h-px bg-gray-300"
              style={{
                left: `calc(50% - ${(node.subordinates.length - 1) * 104}px)`,
                width: `${(node.subordinates.length - 1) * 208}px`,
              }}
            />
          )}

          {/* Subordinate nodes */}
          <div className="flex gap-4 pt-0">
            {node.subordinates.map((sub, index) => (
              <div key={sub.id} className="flex flex-col items-center">
                {/* Vertical connector from horizontal line */}
                <div className="w-px h-8 bg-gray-300" />
                <OrgNode
                  node={sub}
                  level={level + 1}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function OrgChart({ tree, currentUserId, isAdmin }: OrgChartProps) {
  const [selectedNode, setSelectedNode] = useState<OrgChartNode | null>(null)

  return (
    <div className="space-y-6">
      {/* Legend */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-gray-500">Legenda:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-sm">Administrador</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#043F8D]" />
              <span className="text-sm">Gestor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <span className="text-sm">Colaborador</span>
            </div>
            <div className="ml-auto text-sm text-gray-400">
              Clique em uma pessoa para ver detalhes
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Org Chart */}
      <div className="overflow-x-auto pb-8">
        <div className="flex justify-center gap-8 min-w-max pt-4">
          {tree.map(rootNode => (
            <OrgNode
              key={rootNode.id}
              node={rootNode}
              level={0}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onSelect={setSelectedNode}
            />
          ))}
        </div>
      </div>

      {/* User Details Dialog */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Colaborador</DialogTitle>
          </DialogHeader>
          {selectedNode && (
            <div className="space-y-4">
              {/* Avatar and Name */}
              <div className="flex items-center gap-4">
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl
                  ${selectedNode.role === 'admin' ? 'bg-red-500' : selectedNode.role === 'gestor' ? 'bg-[#043F8D]' : 'bg-gray-400'}
                `}>
                  {selectedNode.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedNode.name}</h3>
                  <Badge className={`mt-1 ${selectedNode.role === 'admin' ? 'bg-red-100 text-red-700' : selectedNode.role === 'gestor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {ROLE_LABELS[selectedNode.role]}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{selectedNode.email}</span>
                </div>
                {selectedNode.position && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Briefcase className="h-4 w-4" />
                    <span>{selectedNode.position}</span>
                  </div>
                )}
                {selectedNode.department && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Building className="h-4 w-4" />
                    <span>{selectedNode.department}</span>
                  </div>
                )}
                {selectedNode.subordinates.length > 0 && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{selectedNode.subordinates.length} liderado(s)</span>
                  </div>
                )}
              </div>

              {/* Subordinates list */}
              {selectedNode.subordinates.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Liderados:</h4>
                  <div className="space-y-2">
                    {selectedNode.subordinates.map(sub => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => setSelectedNode(sub)}
                      >
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-white text-sm
                          ${sub.role === 'admin' ? 'bg-red-500' : sub.role === 'gestor' ? 'bg-[#043F8D]' : 'bg-gray-400'}
                        `}>
                          {sub.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{sub.name}</p>
                          <p className="text-xs text-gray-500">{sub.position || ROLE_LABELS[sub.role]}</p>
                        </div>
                        {sub.subordinates.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {sub.subordinates.length} liderado(s)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
