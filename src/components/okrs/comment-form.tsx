'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Profile } from '@/types/database'
import { Send, X } from 'lucide-react'

interface CommentFormProps {
  profile: Profile
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
  isReply?: boolean
  onCancel?: () => void
  mentionableUsers?: Profile[]
}

export function CommentForm({
  profile,
  onSubmit,
  placeholder = 'Escreva um comentario...',
  autoFocus = false,
  isReply = false,
  onCancel,
  mentionableUsers = [],
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionStartPos, setMentionStartPos] = useState(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = async () => {
    if (!content.trim()) return
    setLoading(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)

    // Check for @ mentions
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex !== -1 && !textBeforeCursor.slice(atIndex).includes(' ')) {
      const searchTerm = textBeforeCursor.slice(atIndex + 1)
      setMentionSearch(searchTerm)
      setMentionStartPos(atIndex)
      setShowMentions(true)
    } else {
      setShowMentions(false)
      setMentionStartPos(-1)
    }
  }

  const handleMentionSelect = (user: Profile) => {
    const before = content.slice(0, mentionStartPos)
    const after = content.slice(textareaRef.current?.selectionStart || content.length)
    const newContent = `${before}@${user.name} ${after}`
    setContent(newContent)
    setShowMentions(false)
    setMentionStartPos(-1)
    textareaRef.current?.focus()
  }

  const filteredUsers = mentionableUsers.filter(user =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase()) &&
    user.id !== profile.id
  ).slice(0, 5)

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}>
      <Avatar className={isReply ? 'h-7 w-7' : 'h-8 w-8'}>
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback className="text-xs">
          {profile.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`min-h-[${isReply ? '60px' : '80px'}] resize-none`}
            disabled={loading}
          />
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-full max-w-xs bg-popover border rounded-md shadow-md z-10">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                  onClick={() => handleMentionSelect(user)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Ctrl+Enter para enviar {mentionableUsers.length > 0 && '| @ para mencionar'}
          </p>
          <div className="flex gap-2">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
            >
              <Send className="h-4 w-4 mr-1" />
              {isReply ? 'Responder' : 'Comentar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
