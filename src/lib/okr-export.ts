import {
  ObjectiveWithKRs,
  OKRCycle,
  OKR_LEVEL_LABELS,
  OKR_STATUS_LABELS,
  AREA_LABELS,
  AreaType,
} from '@/types/database'

interface ExportData {
  cycle: OKRCycle
  objectives: ObjectiveWithKRs[]
}

/**
 * Generate CSV content for OKRs
 */
export function generateOKRsCSV(data: ExportData): string {
  const headers = [
    'Nivel',
    'Area',
    'Objetivo',
    'Descricao',
    'Status',
    'Score Atual',
    'Key Results',
    'Responsavel',
  ]

  const rows = data.objectives.map((obj) => {
    const krSummary = obj.key_results
      ?.map((kr) => `${kr.title} (${kr.current_score.toFixed(1)})`)
      .join('; ')

    return [
      OKR_LEVEL_LABELS[obj.level],
      obj.area ? AREA_LABELS[obj.area as AreaType] : '',
      `"${obj.title.replace(/"/g, '""')}"`,
      `"${(obj.description || '').replace(/"/g, '""')}"`,
      OKR_STATUS_LABELS[obj.status],
      obj.current_score.toFixed(1),
      `"${krSummary || ''}"`,
      (obj.owner as any)?.name || '',
    ]
  })

  const csvContent = [
    `Ciclo: ${data.cycle.name}`,
    `Periodo: ${data.cycle.start_date} a ${data.cycle.end_date}`,
    `Exportado em: ${new Date().toLocaleDateString('pt-BR')}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Generate detailed CSV with Key Results
 */
export function generateDetailedCSV(data: ExportData): string {
  const headers = [
    'Nivel',
    'Area',
    'Objetivo',
    'Score Objetivo',
    'Key Result',
    'Valor Inicial',
    'Valor Atual',
    'Valor Meta',
    'Unidade',
    'Score KR',
    'Status',
  ]

  const rows: string[][] = []

  data.objectives.forEach((obj) => {
    if (!obj.key_results || obj.key_results.length === 0) {
      rows.push([
        OKR_LEVEL_LABELS[obj.level],
        obj.area ? AREA_LABELS[obj.area as AreaType] : '',
        `"${obj.title.replace(/"/g, '""')}"`,
        obj.current_score.toFixed(1),
        '',
        '',
        '',
        '',
        '',
        '',
        OKR_STATUS_LABELS[obj.status],
      ])
    } else {
      obj.key_results.forEach((kr, index) => {
        rows.push([
          index === 0 ? OKR_LEVEL_LABELS[obj.level] : '',
          index === 0 ? (obj.area ? AREA_LABELS[obj.area as AreaType] : '') : '',
          index === 0 ? `"${obj.title.replace(/"/g, '""')}"` : '',
          index === 0 ? obj.current_score.toFixed(1) : '',
          `"${kr.title.replace(/"/g, '""')}"`,
          kr.start_value.toString(),
          kr.current_value.toString(),
          kr.target_value.toString(),
          kr.unit || '',
          kr.current_score.toFixed(1),
          index === 0 ? OKR_STATUS_LABELS[obj.status] : '',
        ])
      })
    }
  })

  const csvContent = [
    `Ciclo: ${data.cycle.name}`,
    `Periodo: ${data.cycle.start_date} a ${data.cycle.end_date}`,
    `Exportado em: ${new Date().toLocaleDateString('pt-BR')}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Download content as file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(['\ufeff' + content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export OKRs to CSV
 */
export function exportToCSV(data: ExportData, detailed: boolean = false) {
  const csv = detailed ? generateDetailedCSV(data) : generateOKRsCSV(data)
  const filename = `okrs_${data.cycle.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
  downloadFile(csv, filename, 'text/csv')
}

/**
 * Generate HTML for PDF export
 */
export function generatePDFHTML(data: ExportData): string {
  const avgScore =
    data.objectives.length > 0
      ? data.objectives.reduce((sum, o) => sum + o.current_score, 0) / data.objectives.length
      : 0

  const onTrack = data.objectives.filter((o) => o.current_score >= 7).length
  const atRisk = data.objectives.filter((o) => o.current_score >= 4 && o.current_score < 7).length
  const offTrack = data.objectives.filter((o) => o.current_score < 4).length

  const getScoreColor = (score: number) => {
    if (score >= 7) return '#22C55E'
    if (score >= 4) return '#EAB308'
    return '#EF4444'
  }

  const objectivesHTML = data.objectives
    .map(
      (obj) => `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <div>
          <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">
            ${OKR_LEVEL_LABELS[obj.level]}
          </span>
          ${obj.area ? `<span style="background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${AREA_LABELS[obj.area as AreaType]}</span>` : ''}
        </div>
        <div style="font-size: 24px; font-weight: bold; color: ${getScoreColor(obj.current_score)};">
          ${obj.current_score.toFixed(1)}
        </div>
      </div>
      <h3 style="margin: 0 0 8px 0; font-size: 16px;">${obj.title}</h3>
      ${obj.description ? `<p style="color: #6b7280; margin: 0 0 12px 0; font-size: 14px;">${obj.description}</p>` : ''}

      ${
        obj.key_results && obj.key_results.length > 0
          ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Key Results:</p>
          ${obj.key_results
            .map(
              (kr) => `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6;">
              <span style="font-size: 14px;">${kr.title}</span>
              <span style="font-weight: 500; color: ${getScoreColor(kr.current_score)};">
                ${kr.current_value}/${kr.target_value} ${kr.unit || ''} (${kr.current_score.toFixed(1)})
              </span>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }
    </div>
  `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatorio OKRs - ${data.cycle.name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0 0 8px 0;">Relatorio de OKRs</h1>
        <h2 style="margin: 0; color: #6b7280; font-weight: normal;">${data.cycle.name}</h2>
        <p style="color: #9ca3af; font-size: 14px;">
          ${new Date(data.cycle.start_date).toLocaleDateString('pt-BR')} - ${new Date(data.cycle.end_date).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div style="display: flex; gap: 16px; margin-bottom: 30px;">
        <div style="flex: 1; text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">Total OKRs</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold;">${data.objectives.length}</p>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">Score Medio</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold; color: ${getScoreColor(avgScore)};">${avgScore.toFixed(1)}</p>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background: #dcfce7; border-radius: 8px;">
          <p style="margin: 0; color: #166534; font-size: 12px;">No Caminho</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold; color: #22C55E;">${onTrack}</p>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background: #fef9c3; border-radius: 8px;">
          <p style="margin: 0; color: #854d0e; font-size: 12px;">Em Risco</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold; color: #EAB308;">${atRisk}</p>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background: #fee2e2; border-radius: 8px;">
          <p style="margin: 0; color: #991b1b; font-size: 12px;">Fora</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold; color: #EF4444;">${offTrack}</p>
        </div>
      </div>

      <h2 style="font-size: 18px; margin-bottom: 16px;">Objetivos</h2>
      ${objectivesHTML}

      <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">
        Gerado em ${new Date().toLocaleString('pt-BR')}
      </div>
    </body>
    </html>
  `
}

/**
 * Export OKRs to PDF (opens print dialog)
 */
export function exportToPDF(data: ExportData) {
  const html = generatePDFHTML(data)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}
