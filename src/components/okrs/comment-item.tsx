'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { GenericCommentWithAuthor, Profile } from '@/types/database'
import { MessageCircle, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CommentForm } from './comment-form'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CommentItemProps {
  comment: GenericCommentWithAuthor
  currentUser: Profile
  onReply: (parentId: string, content: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  onEdit?: (commentId: string, content: string) => Promise<void>
  mentionableUsers?: Profile[]
  depth?: number
}

export function CommentItem({
  comment,
  currentUser,
  onReply,
  onDelete,
  onEdit,
  mentionableUsers = [],
  depth = 0,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const isOwner = comment.author_id === currentUser.id
  const canReply = depth < 2 // Limit nesting to 2 levels
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ptBR,
  })

  const handleReply = async (content: string) => {
    await onReply(comment.id, content)
    setShowReplyForm(false)
  }

  const handleEdit = async () => {
    if (onEdit && editContent.trim() !== comment.content) {
      await onEdit(comment.id, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (onDelete && confirm('Tem certeza que deseja excluir este comentario?')) {
      await onDelete(comment.id)
    }
  }

  // Parse content for @mentions and make them bold
  const renderContent = (text: string) => {
    const parts = text.split(/(@[\w\s]+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="font-medium text-primary">
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-10 pt-3 border-l-2 border-muted pl-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {comment.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-xs text-muted-foreground">(editado)</span>
              )}
            </div>
            {isOwner && (onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 text-sm border rounded-md resize-none min-h-[60px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(comment.content)
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">
              {renderContent(comment.content)}
            </p>
          )}

          {canReply && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Responder
            </Button>
          )}
        </div>
      </div>

      {showReplyForm && (
        <div className="ml-10">
          <CommentForm
            profile={currentUser}
            onSubmit={handleReply}
            placeholder={`Responder a ${comment.author.name}...`}
            isReply
            autoFocus
            onCancel={() => setShowReplyForm(false)}
            mentionableUsers={mentionableUsers}
          />
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              mentionableUsers={mentionableUsers}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
