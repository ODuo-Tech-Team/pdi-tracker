'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ObjectiveWithKRs,
  Profile,
  OKR_LEVEL_LABELS,
  AREA_LABELS,
  AREA_COLORS,
  AreaType,
} from '@/types/database'
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  User,
  Circle,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OKRTreeNodeProps {
  objective: ObjectiveWithKRs & {
    owner?: Profile
    children?: (ObjectiveWithKRs & { owner?: Profile; children?: any[] })[]
  }
  level?: number
  isLast?: boolean
  parentLines?: boolean[]
}

function getScoreColor(score: number): string {
  if (score >= 7) return 'text-green-600'
  if (score >= 4) return 'text-yellow-600'
  return 'text-red-600'
}

function getTrafficLightColor(score: number): string {
  if (score >= 7) return '#22C55E'
  if (score >= 4) return '#EAB308'
  return '#EF4444'
}

const levelIcons = {
  company: Building2,
  area: Users,
  head: Users,
  individual: User,
}

export function OKRTreeNode({
  objective,
  level = 0,
  isLast = false,
  parentLines = [],
}: OKRTreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 2)
  const hasChildren = objective.children && objective.children.length > 0
  const LevelIcon = levelIcons[objective.level]
  const trafficColor = getTrafficLightColor(objective.current_score)

  return (
    <div className="relative">
      {/* Connecting lines */}
      {level > 0 && (
        <>
          {/* Vertical line from parent */}
          <div
            className="absolute border-l-2 border-muted-foreground/30"
            style={{
              left: -20,
              top: 0,
              height: isLast ? 24 : '100%',
            }}
          />
          {/* Horizontal line to node */}
          <div
            className="absolute border-t-2 border-muted-foreground/30"
            style={{
              left: -20,
              top: 24,
              width: 20,
            }}
          />
        </>
      )}

      {/* Node content */}
      <div
        className={cn(
          'relative flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-all',
          level === 0 && 'border-2 border-primary/20'
        )}
      >
        {/* Expand/Collapse button */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        {!hasChildren && <div className="w-6" />}

        {/* Traffic light indicator */}
        <div
          className="flex items-center justify-center h-10 w-10 rounded-full shrink-0"
          style={{ backgroundColor: `${trafficColor}20` }}
        >
          <Circle
            className="h-5 w-5"
            style={{ fill: trafficColor, color: trafficColor }}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className="text-xs">
              <LevelIcon className="h-3 w-3 mr-1" />
              {OKR_LEVEL_LABELS[objective.level]}
            </Badge>
            {objective.area && (
              <Badge
                className="text-xs"
                style={{
                  backgroundColor: AREA_COLORS[objective.area as AreaType],
                  color: 'white',
                }}
              >
                {AREA_LABELS[objective.area as AreaType]}
              </Badge>
            )}
          </div>

          <Link
            href={`/dashboard/okrs/${objective.id}`}
            className="group flex items-center gap-1"
          >
            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {objective.title}
            </h4>
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>

          {/* Owner */}
          {objective.owner && (
            <div className="flex items-center gap-1 mt-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={objective.owner.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {objective.owner.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {objective.owner.name}
              </span>
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className={cn('font-medium', getScoreColor(objective.current_score))}>
                {objective.current_score.toFixed(1)}/10
              </span>
            </div>
            <Progress value={objective.current_score * 10} className="h-1.5" />
          </div>

          {/* Key Results summary */}
          {objective.key_results && objective.key_results.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {objective.key_results.length} Key Result(s)
            </div>
          )}
        </div>

        {/* Score badge */}
        <div
          className={cn(
            'text-lg font-bold shrink-0 px-2 py-1 rounded',
            getScoreColor(objective.current_score)
          )}
          style={{ backgroundColor: `${trafficColor}10` }}
        >
          {objective.current_score.toFixed(1)}
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="ml-10 mt-2 space-y-2">
          {objective.children!.map((child, index) => (
            <OKRTreeNode
              key={child.id}
              objective={child}
              level={level + 1}
              isLast={index === objective.children!.length - 1}
              parentLines={[...parentLines, !isLast]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
