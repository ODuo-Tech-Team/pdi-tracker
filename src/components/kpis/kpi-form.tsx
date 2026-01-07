'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Objective,
  AREA_LABELS,
  AreaType,
  KPI_FREQUENCY_LABELS,
  KPI_METRIC_TYPE_LABELS,
  KPIFrequency,
  KPIMetricType,
} from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface KPIFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile | null
  objectives: Pick<Objective, 'id' | 'title' | 'area'>[]
}

export function KPIFormDialog({ open, onOpenChange, profile, objectives }: KPIFormDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [area, setArea] = useState<string>(profile?.area || '')
  const [metricType, setMetricType] = useState<KPIMetricType>('number')
  const [unit, setUnit] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [frequency, setFrequency] = useState<KPIFrequency>('weekly')
  const [linkedObjectiveId, setLinkedObjectiveId] = useState('')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setArea(profile?.area || '')
    setMetricType('number')
    setUnit('')
    setTargetValue('')
    setFrequency('weekly')
    setLinkedObjectiveId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Titulo do KPI e obrigatorio')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('kpis')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          owner_id: profile?.id,
          area: area || null,
          metric_type: metricType,
          unit: unit.trim() || null,
          target_value: targetValue ? parseFloat(targetValue) : null,
          current_value: 0,
          frequency,
          linked_objective_id: linkedObjectiveId || null,
          is_active: true,
        })

      if (error) throw error

      toast.success('KPI criado com sucesso!')
      resetForm()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error creating KPI:', error)
      toast.error('Erro ao criar KPI')
    } finally {
      setLoading(false)
    }
  }

  // Filter objectives by user area
  const userAreaObjectives = objectives.filter(obj => obj.area === profile?.area)
  const otherObjectives = objectives.filter(obj => obj.area !== profile?.area)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo KPI</DialogTitle>
            <DialogDescription>
              Crie um indicador de performance para acompanhar seus resultados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titulo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Taxa de Conversao de Leads"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que este KPI mede..."
                rows={2}
              />
            </div>

            {/* Area */}
            <div className="space-y-2">
              <Label>Area</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a area" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AREA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metric Type and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Metrica</Label>
                <Select value={metricType} onValueChange={(v) => setMetricType(v as KPIMetricType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KPI_METRIC_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="%, leads, R$"
                />
              </div>
            </div>

            {/* Target Value and Frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meta (Target)</Label>
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="Valor alvo"
                />
              </div>
              <div className="space-y-2">
                <Label>Frequencia</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as KPIFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KPI_FREQUENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linked Objective */}
            <div className="space-y-2">
              <Label>Vincular a OKR (opcional)</Label>
              <Select value={linkedObjectiveId} onValueChange={setLinkedObjectiveId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um OKR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {userAreaObjectives.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        Sua Area
                      </div>
                      {userAreaObjectives.map((obj) => (
                        <SelectItem key={obj.id} value={obj.id}>
                          {obj.title}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {otherObjectives.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        Outras Areas
                      </div>
                      {otherObjectives.map((obj) => (
                        <SelectItem key={obj.id} value={obj.id}>
                          {obj.title}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#F58300] hover:bg-[#e07600]" disabled={loading}>
              {loading ? 'Criando...' : 'Criar KPI'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
