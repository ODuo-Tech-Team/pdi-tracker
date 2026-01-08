'use client'

import { useState, useEffect } from 'react'
import { Notification } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Check, Target, AlertTriangle, Trophy, Users, Info, ThumbsUp, ThumbsDown, MessageSquare, AtSign, Clock, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface NotificationsBellProps {
  userId: string
}

export function NotificationsBell({ userId }: NotificationsBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data as Notification[])
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, is_read: true } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'goal_due_soon':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'goal_overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'goal_completed':
        return <Target className="h-4 w-4 text-green-500" />
      case 'streak_milestone':
        return <Trophy className="h-4 w-4 text-orange-500" />
      case 'team_update':
        return <Users className="h-4 w-4 text-blue-500" />
      // OKR notification types
      case 'okr_approved':
        return <ThumbsUp className="h-4 w-4 text-green-500" />
      case 'okr_rejected':
        return <ThumbsDown className="h-4 w-4 text-red-500" />
      case 'okr_comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'okr_mention':
        return <AtSign className="h-4 w-4 text-purple-500" />
      case 'okr_checkin_reminder':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'okr_goal_achieved':
        return <Star className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F58300] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#F58300] hover:text-[#e07600]"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`
                    p-4 hover:bg-gray-50 transition-colors cursor-pointer
                    ${!notification.is_read ? 'bg-blue-50/50' : ''}
                  `}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id)
                    }
                    if (notification.link) {
                      setOpen(false)
                    }
                  }}
                >
                  {notification.link ? (
                    <Link href={notification.link} className="block">
                      <NotificationItem notification={notification} getIcon={getIcon} />
                    </Link>
                  ) : (
                    <NotificationItem notification={notification} getIcon={getIcon} />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({
  notification,
  getIcon,
}: {
  notification: Notification
  getIcon: (type: string) => React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-1">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>
      {!notification.is_read && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-[#F58300] rounded-full" />
        </div>
      )}
    </div>
  )
}
