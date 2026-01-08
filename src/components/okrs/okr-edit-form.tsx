'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Profile,
  OKRCycle,
  Objective,
  KeyResult,
  AREA_LABELS,
  AreaType,
} from '@/types/database'
import { ArrowLeft, Plus, Trash2, Target, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface OKREditFormProps {
  profile: Profile | null
  activeCycle: OKRCycle
  areaOKRs: Objective[]
  objective: Objective
  keyResults: KeyResult[]
}

interface KeyResultInput {
  id?: string
  title: string
  metricType: string
  startValue: string
  targetValue: string
  unit: string
  isNew?: boolean
  toDelete?: boolean
}

export function OKREditForm({ profile, activeCycle, areaOKRs, objective, keyResults }: OKREditFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(objective.title)
  const [description, setDescription] = useState(objective.description || '')
  const [parentOKRId, setParentOKRId] = useState(objective.parent_objective_id || '_none_')
  const [krs, setKrs] = useState<KeyResultInput[]>(
    keyResults.map(kr => ({
      id: kr.id,
      title: kr.title,
      metricType: kr.metric_type,
      startValue: kr.start_value.toString(),
      targetValue: kr.target_value.toString(),
      unit: kr.unit || '',
    }))
  )

  // Group area OKRs by area
  const okrsByArea = areaOKRs.reduce((acc, okr) => {
    const area = okr.area || 'other'
    if (!acc[area]) acc[area] = []
    acc[area].push(okr)
    return acc
  }, {} as Record<string, Objective[]>)

  const userArea = profile?.area as AreaType | undefined
  const suggestedOKRs = userArea ? okrsByArea[userArea] : []

  const addKeyResult = () => {
    if (krs.filter(kr => !kr.toDelete).length >= 3) {
      toast.error('Maximo de 3 Key Results por OKR individual')
      return
    }
    setKrs([
      ...krs,
      { title: '', metricType: 'number', startValue: '0', targetValue: '', unit: '', isNew: true }
    ])
  }

  const removeKeyResult = (index: number) => {
    const kr = krs[index]
    if (kr.id) {
      // Mark existing KR for deletion
      const updated = [...krs]
      updated[index] = { ...kr, toDelete: true }
      setKrs(updated)
    } else {
      // Remove new KR from array
      setKrs(krs.filter((_, i) => i !== index))
    }
  }

  const updateKeyResult = (index: number, field: keyof KeyResultInput, value: string) => {
    const updated = [...krs]
    updated[index] = { ...updated[index], [field]: value }
    setKrs(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Titulo do OKR e obrigatorio')
      return
    }

    if (!parentOKRId) {
      toast.error('Selecione um OKR de area para vincular')
      return
    }

    const activeKRs = krs.filter(kr => !kr.toDelete)
    const validKRs = activeKRs.filter(kr => kr.title.trim() !== '' && kr.targetValue.trim() !== '')
    if (validKRs.length === 0) {
      toast.error('Adicione pelo menos 1 Key Result com titulo e meta preenchidos')
      return
    }

    setLoading(true)

    try {
      // Update objective
      const { error: objError } = await supabase
        .from('objectives')
        .update({
          parent_objective_id: parentOKRId === '_none_' ? null : parentOKRId,
          title: title.trim(),
          description: description.trim() || null,
        })
        .eq('id', objective.id)

      if (objError) throw objError

      // Handle Key Results
      for (const kr of krs) {
        if (kr.toDelete && kr.id) {
          // Delete existing KR
          await supabase
            .from('key_results')
            .delete()
            .eq('id', kr.id)
        } else if (kr.id && !kr.toDelete) {
          // Update existing KR
          await supabase
            .from('key_results')
            .update({
              title: kr.title.trim(),
              metric_type: kr.metricType,
              start_value: parseFloat(kr.startValue) || 0,
              target_value: parseFloat(kr.targetValue),
              unit: kr.unit.trim() || null,
            })
            .eq('id', kr.id)
        } else if (kr.isNew && kr.title.trim() && kr.targetValue.trim()) {
          // Create new KR
          const position = krs.filter(k => !k.toDelete).indexOf(kr) + 1
          await supabase
            .from('key_results')
            .insert({
              objective_id: objective.id,
              title: kr.title.trim(),
              metric_type: kr.metricType,
              start_value: parseFloat(kr.startValue) || 0,
              target_value: parseFloat(kr.targetValue),
              unit: kr.unit.trim() || null,
              position,
            })
        }
      }

      toast.success('OKR atualizado com sucesso!')
      router.push(`/dashboard/okrs/${objective.id}`)
    } catch (error) {
      console.error('Error updating OKR:', error)
      toast.error('Erro ao atualizar OKR')
    } finally {
      setLoading(false)
    }
  }

  const activeKRs = krs.filter(kr => !kr.toDelete)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/dashboard/okrs/${objective.id}`}>
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para OKR
        </Button>
      </Link>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Editar OKR - {activeCycle.name}
            </CardTitle>
            <CardDescription>
              Atualize seu objetivo e os resultados chave
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Parent OKR Selection */}
            <div className="space-y-2">
              <Label htmlFor="parentOKR">Vincular a OKR da Area *</Label>
              <Select value={parentOKRId} onValueChange={setParentOKRId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o OKR da area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Sem vinculo</SelectItem>
                  {suggestedOKRs.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        Sugerido (sua area)
                      </div>
                      {suggestedOKRs.map((okr) => (
                        <SelectItem key={okr.id} value={okr.id}>
                          {okr.title}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {Object.entries(okrsByArea)
                    .filter(([area]) => area !== userArea)
                    .map(([area, okrs]) => (
                      <div key={area}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {AREA_LABELS[area as AreaType] || area}
                        </div>
                        {okrs.map((okr) => (
                          <SelectItem key={okr.id} value={okr.id}>
                            {okr.title}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Objective (Titulo) *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Como meu trabalho vai ajudar o OKR da minha area?"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descricao (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contexto adicional sobre seu objetivo..."
                rows={3}
              />
            </div>

            {/* Key Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Key Results ({activeKRs.length}/3)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeyResult}
                  disabled={activeKRs.length >= 3}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar KR
                </Button>
              </div>

              {krs.map((kr, index) => {
                if (kr.toDelete) return null
                return (
                  <Card key={kr.id || `new-${index}`} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <Label className="text-base">
                          Key Result {activeKRs.indexOf(kr) + 1}
                          {kr.isNew && <span className="text-xs text-orange-500 ml-2">(novo)</span>}
                        </Label>
                        {activeKRs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeKeyResult(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Titulo do KR *</Label>
                        <Input
                          value={kr.title}
                          onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                          placeholder="Ex: Aumentar a taxa de qualificacao de leads em X%"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Metrica</Label>
                          <Select
                            value={kr.metricType}
                            onValueChange={(v) => updateKeyResult(index, 'metricType', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="number">Numero</SelectItem>
                              <SelectItem value="percentage">Percentual</SelectItem>
                              <SelectItem value="currency">Valor (R$)</SelectItem>
                              <SelectItem value="boolean">Sim/Nao</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Unidade (opcional)</Label>
                          <Input
                            value={kr.unit}
                            onChange={(e) => updateKeyResult(index, 'unit', e.target.value)}
                            placeholder="%, leads, R$, etc"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Valor Inicial</Label>
                          <Input
                            type="number"
                            value={kr.startValue}
                            onChange={(e) => updateKeyResult(index, 'startValue', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Meta (Target) *</Label>
                          <Input
                            type="number"
                            value={kr.targetValue}
                            onChange={(e) => updateKeyResult(index, 'targetValue', e.target.value)}
                            placeholder="Valor alvo"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Link href={`/dashboard/okrs/${objective.id}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1 bg-[#F58300] hover:bg-[#e07600]" disabled={loading}>
                {loading ? 'Salvando...' : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alteracoes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
