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
  AREA_LABELS,
  AREA_COLORS,
  AreaType,
} from '@/types/database'
import { ArrowLeft, Plus, Trash2, Target, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface OKRFormProps {
  profile: Profile | null
  activeCycle: OKRCycle
  areaOKRs: Objective[]
}

interface KeyResultInput {
  title: string
  metricType: string
  startValue: string
  targetValue: string
  unit: string
}

export function OKRForm({ profile, activeCycle, areaOKRs }: OKRFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [parentOKRId, setParentOKRId] = useState('')
  const [keyResults, setKeyResults] = useState<KeyResultInput[]>([
    { title: '', metricType: 'number', startValue: '0', targetValue: '', unit: '' }
  ])

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
    if (keyResults.length >= 3) {
      toast.error('Maximo de 3 Key Results por OKR individual')
      return
    }
    setKeyResults([
      ...keyResults,
      { title: '', metricType: 'number', startValue: '0', targetValue: '', unit: '' }
    ])
  }

  const removeKeyResult = (index: number) => {
    setKeyResults(keyResults.filter((_, i) => i !== index))
  }

  const updateKeyResult = (index: number, field: keyof KeyResultInput, value: string) => {
    const updated = [...keyResults]
    updated[index] = { ...updated[index], [field]: value }
    setKeyResults(updated)
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

    const validKRs = keyResults.filter(kr => kr.title.trim() !== '' && kr.targetValue.trim() !== '')
    if (validKRs.length === 0) {
      toast.error('Adicione pelo menos 1 Key Result com titulo e meta preenchidos')
      return
    }

    setLoading(true)

    try {
      // Create objective
      const { data: objective, error: objError } = await supabase
        .from('objectives')
        .insert({
          cycle_id: activeCycle.id,
          owner_id: profile?.id,
          parent_objective_id: parentOKRId,
          level: 'individual',
          title: title.trim(),
          description: description.trim() || null,
          status: 'draft',
        })
        .select()
        .single()

      if (objError) {
        console.error('Objective error:', objError)
        throw objError
      }

      // Create key results
      for (let i = 0; i < validKRs.length; i++) {
        const kr = validKRs[i]
        const { error: krError } = await supabase
          .from('key_results')
          .insert({
            objective_id: objective.id,
            title: kr.title.trim(),
            metric_type: kr.metricType,
            start_value: parseFloat(kr.startValue) || 0,
            target_value: parseFloat(kr.targetValue),
            unit: kr.unit.trim() || null,
            position: i + 1,
          })

        if (krError) {
          console.error('KR error:', krError)
          throw krError
        }
      }

      toast.success('OKR criado com sucesso!')
      router.push(`/dashboard/okrs/${objective.id}`)
    } catch (error) {
      console.error('Error creating OKR:', error)
      toast.error('Erro ao criar OKR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/dashboard/okrs">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para OKRs
        </Button>
      </Link>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Regras para OKR Individual</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Cada colaborador pode ter apenas 1 OKR por ciclo</li>
            <li>Maximo de 3 Key Results por OKR</li>
            <li>O OKR deve estar vinculado a um OKR da sua area</li>
            <li>Key Results devem medir resultado, nao esforco</li>
            <li>60-70% de atingimento e considerado sucesso</li>
          </ul>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Criar Meu OKR - {activeCycle.name}
            </CardTitle>
            <CardDescription>
              Defina seu objetivo e os resultados chave que demonstram seu alcance
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
                placeholder="Como meu trabalho vai ajudar o OKR da minha area em 2026?"
              />
              <p className="text-sm text-muted-foreground">
                Descreva o impacto que voce quer gerar
              </p>
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
                <Label>Key Results ({keyResults.length}/3)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeyResult}
                  disabled={keyResults.length >= 3}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar KR
                </Button>
              </div>

              {keyResults.map((kr, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <Label className="text-base">Key Result {index + 1}</Label>
                      {keyResults.length > 1 && (
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
              ))}
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Link href="/dashboard/okrs" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Criando...' : 'Criar OKR'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
