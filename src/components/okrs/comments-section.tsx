'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GenericCommentWithAuthor, Profile, EntityType } from '@/types/database'
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CommentsSectionProps {
  entityType: EntityType
  entityId: string
  profile: Profile
  initialComments?: GenericCommentWithAuthor[]
  mentionableUsers?: Profile[]
}

export function CommentsSection({
  entityType,
  entityId,
  profile,
  initialComments = [],
  mentionableUsers = [],
}: CommentsSectionProps) {
  const [comments, setComments] = useState<GenericCommentWithAuthor[]>(initialComments)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const supabase = createClient()

  // Organize comments into tree structure
  const organizeComments = (flatComments: GenericCommentWithAuthor[]): GenericCommentWithAuthor[] => {
    const commentMap = new Map<string, GenericCommentWithAuthor>()
    const rootComments: GenericCommentWithAuthor[] = []

    // First pass: create map
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize hierarchy
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id)
        if (parent) {
          parent.replies = parent.replies || []
          parent.replies.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    // Sort by date (newest first for root, oldest first for replies)
    rootComments.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    rootComments.forEach(comment => {
      if (comment.replies) {
        comment.replies.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }
    })

    return rootComments
  }

  const fetchComments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('okr_comments')
        .select(`
          *,
          author:profiles!author_id(*)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Erro ao carregar comentarios')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (content: string) => {
    try {
      const { data, error } = await supabase
        .from('okr_comments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          author_id: profile.id,
          content,
        })
        .select(`
          *,
          author:profiles!author_id(*)
        `)
        .single()

      if (error) throw error

      setComments(prev => [data, ...prev])
      toast.success('Comentario adicionado!')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Erro ao adicionar comentario')
      throw error
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('okr_comments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          author_id: profile.id,
          content,
          parent_comment_id: parentId,
        })
        .select(`
          *,
          author:profiles!author_id(*)
        `)
        .single()

      if (error) throw error

      setComments(prev => [...prev, data])
      toast.success('Resposta adicionada!')
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Erro ao adicionar resposta')
      throw error
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('okr_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId && c.parent_comment_id !== commentId))
      toast.success('Comentario excluido!')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Erro ao excluir comentario')
    }
  }

  const handleEdit = async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('okr_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, content, updated_at: new Date().toISOString() } : c
      ))
      toast.success('Comentario atualizado!')
    } catch (error) {
      console.error('Error editing comment:', error)
      toast.error('Erro ao editar comentario')
    }
  }

  const organizedComments = organizeComments(comments)
  const totalComments = comments.length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5" />
            Comentarios
            {totalComments > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({totalComments})
              </span>
            )}
          </CardTitle>
          {totalComments > 0 && (
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
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        <CommentForm
          profile={profile}
          onSubmit={handleAddComment}
          mentionableUsers={mentionableUsers}
        />

        {/* Comments List */}
        {expanded && organizedComments.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            {organizedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={profile}
                onReply={handleReply}
                onDelete={handleDelete}
                onEdit={handleEdit}
                mentionableUsers={mentionableUsers}
              />
            ))}
          </div>
        )}

        {expanded && organizedComments.length === 0 && !loading && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhum comentario ainda. Seja o primeiro a comentar!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
