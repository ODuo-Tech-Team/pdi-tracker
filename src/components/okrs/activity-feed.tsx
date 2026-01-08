'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  ActivityWithActor,
  ActivityAction,
  ACTIVITY_ACTION_LABELS,
  EntityType,
} from '@/types/database'
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  CheckCircle,
  MessageCircle,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityFeedProps {
  entityType: EntityType
  entityId: string
  initialActivities?: ActivityWithActor[]
  maxItems?: number
  showFilters?: boolean
}

const actionIcons: Record<ActivityAction, React.ReactNode> = {
  created: <Plus className="h-3 w-3" />,
  updated: <Edit className="h-3 w-3" />,
  checked_in: <TrendingUp className="h-3 w-3" />,
  commented: <MessageCircle className="h-3 w-3" />,
  deleted: <Trash2 className="h-3 w-3" />,
  approved: <ThumbsUp className="h-3 w-3" />,
  rejected: <ThumbsDown className="h-3 w-3" />,
}

const actionColors: Record<ActivityAction, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-purple-100 text-purple-700',
  commented: 'bg-yellow-100 text-yellow-700',
  deleted: 'bg-red-100 text-red-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-orange-100 text-orange-700',
}

export function ActivityFeed({
  entityType,
  entityId,
  initialActivities = [],
  maxItems = 10,
  showFilters = false,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityWithActor[]>(initialActivities)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [filter, setFilter] = useState<ActivityAction | 'all'>('all')
  const [showAll, setShowAll] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (initialActivities.length === 0) {
      fetchActivities()
    }
  }, [entityType, entityId])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          actor:profiles!actor_id(*)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter(a =>
    filter === 'all' || a.action === filter
  )

  const displayedActivities = showAll
    ? filteredActivities
    : filteredActivities.slice(0, maxItems)

  const renderMetadata = (activity: ActivityWithActor) => {
    if (!activity.metadata) return null

    const meta = activity.metadata as Record<string, unknown>

    // Check-in metadata
    if (activity.action === 'checked_in' && meta.score !== undefined) {
      return (
        <span className="text-xs text-muted-foreground ml-1">
          (Score: {Number(meta.score).toFixed(1)})
        </span>
      )
    }

    // Status change metadata
    if (meta.old_status && meta.new_status) {
      return (
        <span className="text-xs text-muted-foreground ml-1">
          ({String(meta.old_status)} → {String(meta.new_status)})
        </span>
      )
    }

    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5" />
            Atividades
            {activities.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({activities.length})
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          {/* Filters */}
          {showFilters && activities.length > 0 && (
            <div className="flex flex-wrap gap-1 pb-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-xs"
                onClick={() => setFilter('all')}
              >
                Todas
              </Button>
              {['created', 'updated', 'checked_in', 'commented', 'approved', 'rejected'].map((action) => (
                <Button
                  key={action}
                  variant={filter === action ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setFilter(action as ActivityAction)}
                >
                  {ACTIVITY_ACTION_LABELS[action as ActivityAction]}
                </Button>
              ))}
            </div>
          )}

          {/* Activity List */}
          <div className="relative">
            {/* Timeline line */}
            {displayedActivities.length > 1 && (
              <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />
            )}

            <div className="space-y-3">
              {displayedActivities.map((activity, index) => (
                <div key={activity.id} className="relative flex gap-3 pl-1">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${actionColors[activity.action]}`}
                  >
                    {actionIcons[activity.action]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {activity.actor && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={activity.actor.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {activity.actor.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {activity.actor.name}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {ACTIVITY_ACTION_LABELS[activity.action]}
                      </span>
                      {renderMetadata(activity)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Show more button */}
          {filteredActivities.length > maxItems && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? 'Mostrar menos'
                : `Ver mais ${filteredActivities.length - maxItems} atividades`}
            </Button>
          )}

          {/* Empty state */}
          {activities.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Nenhuma atividade registrada.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
