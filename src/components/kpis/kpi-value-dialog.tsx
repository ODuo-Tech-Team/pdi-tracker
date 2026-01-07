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
import { KPIWithValues, KPIMetricType } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface KPIValueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kpi: KPIWithValues
}

function getPlaceholder(metricType: KPIMetricType): string {
  switch (metricType) {
    case 'percentage':
      return 'Ex: 85.5'
    case 'currency':
      return 'Ex: 15000'
    case 'boolean':
      return '1 para Sim, 0 para Nao'
    default:
      return 'Digite o valor'
  }
}

export function KPIValueDialog({ open, onOpenChange, kpi }: KPIValueDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setValue('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!value.trim()) {
      toast.error('Valor e obrigatorio')
      return
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      toast.error('Valor invalido')
      return
    }

    setLoading(true)

    try {
      // Insert new value
      const { error: valueError } = await supabase
        .from('kpi_values')
        .insert({
          kpi_id: kpi.id,
          value: numValue,
          notes: notes.trim() || null,
          recorded_at: new Date().toISOString(),
        })

      if (valueError) throw valueError

      // Update current_value on KPI
      const { error: kpiError } = await supabase
        .from('kpis')
        .update({ current_value: numValue })
        .eq('id', kpi.id)

      if (kpiError) throw kpiError

      toast.success('Valor registrado com sucesso!')
      resetForm()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error recording KPI value:', error)
      toast.error('Erro ao registrar valor')
    } finally {
      setLoading(false)
    }
  }

  const metricType = kpi.metric_type as KPIMetricType

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Valor</DialogTitle>
            <DialogDescription>
              {kpi.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current info */}
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Atual:</span>
                <span className="font-medium">{kpi.current_value}</span>
              </div>
              {kpi.target_value && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meta:</span>
                  <span className="font-medium">{kpi.target_value}</span>
                </div>
              )}
            </div>

            {/* New Value */}
            <div className="space-y-2">
              <Label htmlFor="value">Novo Valor *</Label>
              <Input
                id="value"
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={getPlaceholder(metricType)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observacoes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas ou contexto..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#F58300] hover:bg-[#e07600]" disabled={loading}>
              {loading ? 'Salvando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
