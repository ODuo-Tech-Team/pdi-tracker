'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Goal, Profile, Comment, CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS, GoalStatus } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Calendar,
  Target,
  MessageSquare,
  Pencil,
  Trash2,
  Send,
  Loader2,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import Link from 'next/link'

interface GoalWithComments extends Goal {
  comments: Array<Comment & { profiles: { name: string; role: string } | null }>
}

interface MetaDetailProps {
  goal: GoalWithComments
  profile: Profile | null
}

export function MetaDetail({ goal: initialGoal, profile }: MetaDetailProps) {
  const [goal, setGoal] = useState(initialGoal)
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return

    setLoading(true)
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goal.id)

    if (error) {
      toast.error('Erro ao excluir meta')
      setLoading(false)
      return
    }

    toast.success('Meta excluída')
    router.push('/dashboard/metas')
  }

  const handleStatusChange = async (status: GoalStatus) => {
    const { error } = await supabase
      .from('goals')
      .update({ status })
      .eq('id', goal.id)

    if (error) {
      toast.error('Erro ao atualizar status')
      return
    }

    setGoal({ ...goal, status })
    toast.success('Status atualizado')
  }

  const handleProgressChange = async (progress: number) => {
    setGoal({ ...goal, progress })
  }

  const handleProgressCommit = async () => {
    const { error } = await supabase
      .from('goals')
      .update({ progress: goal.progress })
      .eq('id', goal.id)

    if (error) {
      toast.error('Erro ao atualizar progresso')
      return
    }

    toast.success('Progresso atualizado')
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return

    setSubmittingComment(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('comments')
      .insert({
        goal_id: goal.id,
        user_id: user!.id,
        content: comment.trim(),
      })
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles (name, role)
      `)
      .single()

    if (error) {
      toast.error('Erro ao adicionar comentário')
      setSubmittingComment(false)
      return
    }

    const newComment = {
      ...data,
      profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
    } as Comment & { profiles: { name: string; role: string } }

    setGoal({
      ...goal,
      comments: [...goal.comments, newComment],
    })
    setComment('')
    setSubmittingComment(false)
    toast.success('Comentário adicionado')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'overdue':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'profissional':
        return 'bg-blue-100 text-blue-700'
      case 'pessoal':
        return 'bg-purple-100 text-purple-700'
      case 'saude':
        return 'bg-green-100 text-green-700'
      case 'tecnico':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDaysLeft = () => {
    if (!goal.due_date) return null
    const days = differenceInDays(new Date(goal.due_date), new Date())
    if (days < 0) return { text: `${Math.abs(days)} dias atrasada`, color: 'text-red-600' }
    if (days === 0) return { text: 'Vence hoje', color: 'text-orange-600' }
    if (days === 1) return { text: 'Vence amanhã', color: 'text-yellow-600' }
    return { text: `${days} dias restantes`, color: 'text-gray-600' }
  }

  const daysInfo = getDaysLeft()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/metas">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Metas
        </Button>
      </Link>

      {/* Main Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(goal.category)}>
                  {CATEGORY_LABELS[goal.category]}
                </Badge>
                <Badge className={getStatusColor(goal.status)}>
                  {STATUS_LABELS[goal.status]}
                </Badge>
                <Badge variant="outline">
                  {PRIORITY_LABELS[goal.priority]}
                </Badge>
              </div>
              <CardTitle className="text-2xl text-[#043F8D]">{goal.title}</CardTitle>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="icon" disabled={loading}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                disabled={loading}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {goal.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Descrição</h3>
              <p className="text-gray-700">{goal.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <Select value={goal.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Prazo</h3>
              {goal.due_date ? (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">
                    {format(new Date(goal.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  {daysInfo && (
                    <span className={`text-sm ${daysInfo.color}`}>
                      ({daysInfo.text})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-400">Sem prazo definido</span>
              )}
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Progresso</h3>
              <span className="text-lg font-semibold text-[#F58300]">{goal.progress}%</span>
            </div>
            <Slider
              value={[goal.progress]}
              onValueChange={([value]) => handleProgressChange(value)}
              onValueCommit={handleProgressCommit}
              max={100}
              step={5}
              className="py-2"
            />
            <Progress value={goal.progress} className="h-3 mt-2" />
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#043F8D] flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentários ({goal.comments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comment List */}
          {goal.comments && goal.comments.length > 0 ? (
            <div className="space-y-4">
              {goal.comments.map((c) => (
                <div key={c.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-[#043F8D] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {c.profiles?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {c.profiles?.name || 'Usuário'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {c.profiles?.role || 'colaborador'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {format(new Date(c.created_at), "dd/MM 'às' HH:mm")}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhum comentário ainda</p>
          )}

          {/* Add Comment */}
          <div className="flex gap-3 pt-4 border-t">
            <div className="w-8 h-8 bg-[#F58300] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {profile?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="Adicione um comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={handleAddComment}
                disabled={!comment.trim() || submittingComment}
                className="bg-[#F58300] hover:bg-[#e07600] self-end"
              >
                {submittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
