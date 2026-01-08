import { createClient } from '@/lib/supabase/client'
import { EntityType, ActivityAction } from '@/types/database'

interface LogActivityParams {
  entityType: EntityType
  entityId: string
  action: ActivityAction
  actorId: string
  metadata?: Record<string, unknown>
}

/**
 * Log an activity to the activities table
 */
export async function logActivity({
  entityType,
  entityId,
  action,
  actorId,
  metadata,
}: LogActivityParams): Promise<void> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from('activities').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor_id: actorId,
      metadata: metadata || null,
    })

    if (error) {
      console.error('Error logging activity:', error)
    }
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

/**
 * Log OKR creation
 */
export async function logOKRCreated(
  objectiveId: string,
  actorId: string,
  title: string
): Promise<void> {
  await logActivity({
    entityType: 'objective',
    entityId: objectiveId,
    action: 'created',
    actorId,
    metadata: { title },
  })
}

/**
 * Log OKR update
 */
export async function logOKRUpdated(
  objectiveId: string,
  actorId: string,
  changes: Record<string, unknown>
): Promise<void> {
  await logActivity({
    entityType: 'objective',
    entityId: objectiveId,
    action: 'updated',
    actorId,
    metadata: { changes },
  })
}

/**
 * Log OKR status change (approved/rejected)
 */
export async function logOKRStatusChange(
  objectiveId: string,
  actorId: string,
  oldStatus: string,
  newStatus: string,
  notes?: string
): Promise<void> {
  const action = newStatus === 'tracking' ? 'approved' : 'rejected'
  await logActivity({
    entityType: 'objective',
    entityId: objectiveId,
    action,
    actorId,
    metadata: { old_status: oldStatus, new_status: newStatus, notes },
  })
}

/**
 * Log Key Result check-in
 */
export async function logKRCheckIn(
  keyResultId: string,
  actorId: string,
  previousValue: number,
  newValue: number,
  score: number,
  confidence?: string
): Promise<void> {
  await logActivity({
    entityType: 'key_result',
    entityId: keyResultId,
    action: 'checked_in',
    actorId,
    metadata: {
      previous_value: previousValue,
      new_value: newValue,
      score,
      confidence,
    },
  })
}

/**
 * Log comment added
 */
export async function logCommentAdded(
  entityType: EntityType,
  entityId: string,
  actorId: string,
  commentId: string
): Promise<void> {
  await logActivity({
    entityType,
    entityId,
    action: 'commented',
    actorId,
    metadata: { comment_id: commentId },
  })
}

/**
 * Log KPI value recorded
 */
export async function logKPIValueRecorded(
  kpiId: string,
  actorId: string,
  value: number,
  previousValue?: number
): Promise<void> {
  await logActivity({
    entityType: 'kpi',
    entityId: kpiId,
    action: 'checked_in',
    actorId,
    metadata: {
      value,
      previous_value: previousValue,
    },
  })
}
