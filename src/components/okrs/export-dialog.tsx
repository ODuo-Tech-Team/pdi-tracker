'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ObjectiveWithKRs, OKRCycle } from '@/types/database'
import { Download, FileSpreadsheet, FileText, Loader2, Check } from 'lucide-react'
import { exportToCSV, exportToPDF } from '@/lib/okr-export'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ExportDialogProps {
  cycle: OKRCycle
  objectives: ObjectiveWithKRs[]
  trigger?: React.ReactNode
}

type ExportFormat = 'csv' | 'csv-detailed' | 'pdf'

export function ExportDialog({ cycle, objectives, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (objectives.length === 0) {
      toast.error('Nenhum OKR para exportar')
      return
    }

    setExporting(true)
    try {
      const data = { cycle, objectives }

      switch (format) {
        case 'csv':
          exportToCSV(data, false)
          toast.success('CSV exportado!')
          break
        case 'csv-detailed':
          exportToCSV(data, true)
          toast.success('CSV detalhado exportado!')
          break
        case 'pdf':
          exportToPDF(data)
          toast.success('PDF gerado!')
          break
      }

      setOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erro ao exportar')
    } finally {
      setExporting(false)
    }
  }

  const options: { value: ExportFormat; icon: typeof FileText; color: string; label: string; description: string }[] = [
    {
      value: 'pdf',
      icon: FileText,
      color: 'text-red-500',
      label: 'PDF',
      description: 'Relatorio visual com graficos e formatacao. Ideal para apresentacoes.',
    },
    {
      value: 'csv',
      icon: FileSpreadsheet,
      color: 'text-green-500',
      label: 'CSV Resumido',
      description: 'Uma linha por objetivo. Abre no Excel/Google Sheets.',
    },
    {
      value: 'csv-detailed',
      icon: FileSpreadsheet,
      color: 'text-blue-500',
      label: 'CSV Detalhado',
      description: 'Inclui todos os Key Results. Ideal para analises.',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar OKRs</DialogTitle>
          <DialogDescription>
            Escolha o formato de exportacao para o ciclo {cycle.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          {options.map((option) => {
            const Icon = option.icon
            const isSelected = format === option.value

            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors',
                  isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                )}
                onClick={() => setFormat(option.value)}
              >
                <div className={cn('mt-0.5', isSelected ? 'text-primary' : '')}>
                  {isSelected ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-5 w-5', option.color)} />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {objectives.length} objetivo(s)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
