'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Profile,
  ObjectiveWithKRs,
  AREA_LABELS,
  AREA_COLORS,
  AreaType,
} from '@/types/database'
import { CheckCircle, XCircle, Eye, Clock, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface OKRValidationListProps {
  pendingOKRs: (ObjectiveWithKRs & {
    owner?: Profile
    parent?: any
  })[]
  profile: Profile | null
}

export function OKRValidationList({ pendingOKRs, profile }: OKRValidationListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [selectedOKR, setSelectedOKR] = useState<ObjectiveWithKRs | null>(null)
  const [validationNotes, setValidationNotes] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject'>('approve')

  const openDialog = (okr: ObjectiveWithKRs, action: 'approve' | 'reject') => {
    setSelectedOKR(okr)
    setDialogAction(action)
    setValidationNotes('')
    setShowDialog(true)
  }

  const handleValidate = async () => {
    if (!selectedOKR) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('objectives')
        .update({
          status: dialogAction === 'approve' ? 'tracking' : 'rejected',
          validated_by: profile?.id,
          validated_at: new Date().toISOString(),
          validation_notes: validationNotes || null,
        })
        .eq('id', selectedOKR.id)

      if (error) throw error

      toast.success(
        dialogAction === 'approve'
          ? 'OKR aprovado com sucesso!'
          : 'OKR rejeitado. O colaborador sera notificado.'
      )
      setShowDialog(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao validar OKR')
    } finally {
      setLoading(false)
    }
  }

  if (pendingOKRs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum OKR pendente</h3>
          <p className="text-muted-foreground">
            Todos os OKRs da sua equipe foram validados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">OKRs Aguardando Validacao</h2>
          <p className="text-muted-foreground">
            {pendingOKRs.length} OKR(s) pendente(s) de validacao
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Clock className="h-4 w-4" />
          {pendingOKRs.length} pendente(s)
        </Badge>
      </div>

      <div className="grid gap-4">
        {pendingOKRs.map((okr) => (
          <Card key={okr.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {(okr.owner as any)?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{okr.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{(okr.owner as any)?.name}</span>
                      <span>-</span>
                      <span>{(okr.owner as any)?.position || 'Sem cargo'}</span>
                    </CardDescription>
                    {okr.parent && (
                      <Badge
                        variant="outline"
                        className="mt-2"
                        style={{
                          borderColor: AREA_COLORS[okr.parent.area as AreaType],
                          color: AREA_COLORS[okr.parent.area as AreaType],
                        }}
                      >
                        Vinculado: {okr.parent.title}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(okr.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {okr.description && (
                <p className="text-sm text-muted-foreground">{okr.description}</p>
              )}

              {/* Key Results Preview */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Key Results ({okr.key_results?.length || 0})
                </p>
                {okr.key_results?.map((kr, index) => (
                  <div
                    key={kr.id}
                    className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                  >
                    <span>
                      {index + 1}. {kr.title}
                    </span>
                    <span className="text-muted-foreground">
                      Meta: {kr.target_value.toLocaleString('pt-BR')} {kr.unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link href={`/dashboard/okrs/${okr.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDialog(okr, 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button size="sm" onClick={() => openDialog(okr, 'approve')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Validation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'approve' ? 'Aprovar OKR' : 'Rejeitar OKR'}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'approve'
                ? 'O OKR sera aprovado e o colaborador podera comecar a registrar check-ins.'
                : 'O OKR sera rejeitado e devolvido ao colaborador para ajustes.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedOKR && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedOKR.title}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedOKR.owner as any)?.name}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>
                Feedback {dialogAction === 'reject' ? '(recomendado)' : '(opcional)'}
              </Label>
              <Textarea
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                placeholder={
                  dialogAction === 'approve'
                    ? 'Parabens! Bom OKR...'
                    : 'Explique o que precisa ser ajustado...'
                }
                rows={4}
              />
              {dialogAction === 'reject' && (
                <p className="text-sm text-muted-foreground">
                  Dica: Pergunte se isso ajuda o OKR da area, se mede resultado ou apenas
                  esforco, e se esta sob controle dessa pessoa.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant={dialogAction === 'reject' ? 'destructive' : 'default'}
              onClick={handleValidate}
              disabled={loading}
            >
              {loading
                ? 'Processando...'
                : dialogAction === 'approve'
                  ? 'Aprovar OKR'
                  : 'Rejeitar OKR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
