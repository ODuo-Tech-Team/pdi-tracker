'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Profile,
  ObjectiveWithKRs,
  KeyResult,
  KRCheckIn,
  OKR_LEVEL_LABELS,
  OKR_STATUS_LABELS,
  AREA_LABELS,
  AREA_COLORS,
  AreaType,
  OKRStatus,
} from '@/types/database'
import {
  ArrowLeft,
  Building2,
  Users,
  User,
  Calendar,
  Edit,
  CheckCircle,
  XCircle,
  Send,
  TrendingUp,
  Target,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface OKRDetailProps {
  objective: ObjectiveWithKRs & {
    owner?: Profile
    parent?: ObjectiveWithKRs
    cycle?: any
  }
  childObjectives: ObjectiveWithKRs[]
  checkIns: Record<string, KRCheckIn[]>
  profile: Profile | null
  canEdit: boolean
  canValidate: boolean
}

const statusColors: Record<OKRStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_validation: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  tracking: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
}

const levelIcons = {
  company: Building2,
  area: Users,
  head: Users,
  individual: User,
}

function getScoreColor(score: number): string {
  if (score >= 7) return 'text-green-600'
  if (score >= 4) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreBg(score: number): string {
  if (score >= 7) return 'bg-green-100'
  if (score >= 4) return 'bg-yellow-100'
  return 'bg-red-100'
}

export function OKRDetail({
  objective,
  childObjectives,
  checkIns,
  profile,
  canEdit,
  canValidate,
}: OKRDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [validationNotes, setValidationNotes] = useState('')
  const [checkInValue, setCheckInValue] = useState<Record<string, string>>({})
  const [checkInNotes, setCheckInNotes] = useState<Record<string, string>>({})

  const LevelIcon = levelIcons[objective.level]
  const keyResults = objective.key_results || []
  const isOwner = objective.owner_id === profile?.id

  const handleSubmitForValidation = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('objectives')
        .update({ status: 'pending_validation' })
        .eq('id', objective.id)

      if (error) throw error

      toast.success('OKR enviado para validacao!')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar para validacao')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async (approved: boolean) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('objectives')
        .update({
          status: approved ? 'tracking' : 'rejected',
          validated_by: profile?.id,
          validated_at: new Date().toISOString(),
          validation_notes: validationNotes,
        })
        .eq('id', objective.id)

      if (error) throw error

      toast.success(approved ? 'OKR aprovado!' : 'OKR rejeitado')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao validar OKR')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (kr: KeyResult) => {
    const newValue = parseFloat(checkInValue[kr.id] || '0')
    if (isNaN(newValue)) {
      toast.error('Valor invalido')
      return
    }

    setLoading(true)
    try {
      // Calculate score
      const progress = kr.target_value !== kr.start_value
        ? (newValue - kr.start_value) / (kr.target_value - kr.start_value)
        : newValue >= kr.target_value ? 1 : 0
      const score = Math.min(10, Math.max(0, progress * 10))

      // Create check-in
      const { error: checkInError } = await supabase
        .from('kr_check_ins')
        .insert({
          key_result_id: kr.id,
          user_id: profile?.id,
          previous_value: kr.current_value,
          new_value: newValue,
          score: Math.round(score * 10) / 10,
          notes: checkInNotes[kr.id] || null,
        })

      if (checkInError) throw checkInError

      // Update KR current value
      const { error: krError } = await supabase
        .from('key_results')
        .update({ current_value: newValue })
        .eq('id', kr.id)

      if (krError) throw krError

      toast.success('Check-in registrado!')
      setCheckInValue({ ...checkInValue, [kr.id]: '' })
      setCheckInNotes({ ...checkInNotes, [kr.id]: '' })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao registrar check-in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/okrs">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para OKRs
        </Button>
      </Link>

      {/* Main OKR Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LevelIcon className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">{OKR_LEVEL_LABELS[objective.level]}</Badge>
                {objective.area && (
                  <Badge
                    style={{
                      backgroundColor: AREA_COLORS[objective.area as AreaType],
                      color: 'white',
                    }}
                  >
                    {AREA_LABELS[objective.area as AreaType]}
                  </Badge>
                )}
                <Badge className={statusColors[objective.status]}>
                  {OKR_STATUS_LABELS[objective.status]}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{objective.title}</CardTitle>
              {objective.description && (
                <CardDescription className="text-base">
                  {objective.description}
                </CardDescription>
              )}
            </div>
            <div className={cn(
              'text-center p-4 rounded-lg',
              getScoreBg(objective.current_score)
            )}>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className={cn('text-4xl font-bold', getScoreColor(objective.current_score))}>
                {objective.current_score.toFixed(1)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {objective.owner && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {objective.owner.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{objective.owner.name}</span>
              </div>
            )}
            {objective.cycle && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{objective.cycle.name}</span>
              </div>
            )}
            {objective.parent && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Vinculado a: {objective.parent.title}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {canEdit && objective.status === 'draft' && (
              <>
                <Link href={`/dashboard/okrs/${objective.id}/editar`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
                <Button size="sm" onClick={handleSubmitForValidation} disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para Validacao
                </Button>
              </>
            )}
            {canValidate && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">Validar OKR</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Validar OKR</DialogTitle>
                    <DialogDescription>
                      Aprove ou rejeite este OKR. Adicione notas se necessario.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Notas de Validacao (opcional)</Label>
                      <Textarea
                        value={validationNotes}
                        onChange={(e) => setValidationNotes(e.target.value)}
                        placeholder="Feedback sobre o OKR..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => handleValidate(false)}
                      disabled={loading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button onClick={() => handleValidate(true)} disabled={loading}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {objective.validation_notes && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Feedback da Validacao:</p>
              <p className="text-sm text-muted-foreground">{objective.validation_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Results */}
      <Card>
        <CardHeader>
          <CardTitle>Key Results</CardTitle>
          <CardDescription>
            {keyResults.length} resultado(s) chave
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {keyResults.map((kr, index) => (
            <div key={kr.id} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">
                    {index + 1}. {kr.title}
                  </p>
                  {kr.description && (
                    <p className="text-sm text-muted-foreground">{kr.description}</p>
                  )}
                </div>
                <div className={cn(
                  'px-3 py-1 rounded-lg text-center',
                  getScoreBg(kr.current_score)
                )}>
                  <p className={cn('text-xl font-bold', getScoreColor(kr.current_score))}>
                    {kr.current_score.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {kr.current_value.toLocaleString('pt-BR')} / {kr.target_value.toLocaleString('pt-BR')} {kr.unit}
                  </span>
                  <span>{(kr.current_score * 10).toFixed(0)}%</span>
                </div>
                <Progress value={kr.current_score * 10} className="h-2" />
              </div>

              {/* Check-in Form (only for owner in tracking status) */}
              {isOwner && objective.status === 'tracking' && (
                <div className="pt-3 border-t space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Registrar Check-in
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder={`Novo valor (${kr.unit || 'valor'})`}
                        value={checkInValue[kr.id] || ''}
                        onChange={(e) => setCheckInValue({
                          ...checkInValue,
                          [kr.id]: e.target.value
                        })}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(kr)}
                      disabled={loading || !checkInValue[kr.id]}
                    >
                      Salvar
                    </Button>
                  </div>
                  <Input
                    placeholder="Notas (opcional)"
                    value={checkInNotes[kr.id] || ''}
                    onChange={(e) => setCheckInNotes({
                      ...checkInNotes,
                      [kr.id]: e.target.value
                    })}
                  />
                </div>
              )}

              {/* Check-in History */}
              {checkIns[kr.id]?.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Historico de Check-ins</p>
                  <div className="space-y-2">
                    {checkIns[kr.id].slice(0, 3).map((ci) => (
                      <div key={ci.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {format(new Date(ci.check_in_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span>
                          {ci.previous_value?.toLocaleString('pt-BR')} {'->'} {ci.new_value.toLocaleString('pt-BR')}
                        </span>
                        <span className={getScoreColor(ci.score)}>
                          Score: {ci.score.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {keyResults.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Nenhum Key Result cadastrado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Child Objectives (for Company/Area) */}
      {childObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>OKRs Vinculados</CardTitle>
            <CardDescription>
              {childObjectives.length} objetivo(s) vinculado(s) a este OKR
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {childObjectives.map((child) => (
                <Link key={child.id} href={`/dashboard/okrs/${child.id}`}>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {child.owner && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(child.owner as any).name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <p className="font-medium">{child.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {(child.owner as any)?.name || 'Sem dono'}
                        </p>
                      </div>
                    </div>
                    <div className={cn('px-2 py-1 rounded', getScoreBg(child.current_score))}>
                      <span className={cn('font-bold', getScoreColor(child.current_score))}>
                        {child.current_score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
