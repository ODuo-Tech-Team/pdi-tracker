import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Profile, Goal, Habit, STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS, ROLE_LABELS } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TeamMemberReport extends Profile {
  goals: Goal[]
  habits: Habit[]
}

// Export team data to PDF
export function exportTeamToPDF(teamMembers: TeamMemberReport[], managerName: string) {
  const doc = new jsPDF()
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  // Header
  doc.setFontSize(20)
  doc.setTextColor(4, 63, 141) // #043F8D
  doc.text('Relatório de PDI - Equipe', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Gestor: ${managerName}`, 14, 28)
  doc.text(`Data: ${today}`, 14, 34)

  let yPos = 45

  teamMembers.forEach((member, index) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Member header
    doc.setFontSize(14)
    doc.setTextColor(4, 63, 141)
    doc.text(member.name, 14, yPos)

    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`${member.email} | ${member.position || ROLE_LABELS[member.role]}`, 14, yPos + 6)

    yPos += 15

    // Goals table
    if (member.goals.length > 0) {
      doc.setFontSize(11)
      doc.setTextColor(0)
      doc.text('Metas:', 14, yPos)
      yPos += 5

      const goalsData = member.goals.map(goal => [
        goal.title,
        CATEGORY_LABELS[goal.category],
        STATUS_LABELS[goal.status],
        `${goal.progress}%`,
        goal.due_date ? format(new Date(goal.due_date), 'dd/MM/yyyy') : '-',
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Título', 'Categoria', 'Status', 'Progresso', 'Prazo']],
        body: goalsData,
        theme: 'grid',
        headStyles: { fillColor: [4, 63, 141] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Habits summary
    if (member.habits.length > 0) {
      const activeHabits = member.habits.filter(h => h.is_active)
      const totalStreak = activeHabits.reduce((acc, h) => acc + (h.current_streak || 0), 0)

      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`Hábitos ativos: ${activeHabits.length} | Streak total: ${totalStreak} dias`, 14, yPos)
      yPos += 10
    }

    // Separator
    if (index < teamMembers.length - 1) {
      doc.setDrawColor(200)
      doc.line(14, yPos, 196, yPos)
      yPos += 10
    }
  })

  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`PDI Tracker - ODuo Assessoria | Página ${i} de ${pageCount}`, 14, 287)
  }

  doc.save(`relatorio-pdi-equipe-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

// Export individual PDI to PDF
export function exportMemberToPDF(member: TeamMemberReport) {
  const doc = new jsPDF()
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  // Header
  doc.setFontSize(20)
  doc.setTextColor(4, 63, 141)
  doc.text('Relatório Individual de PDI', 14, 20)

  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(member.name, 14, 30)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(member.email, 14, 36)
  doc.text(`${member.position || ROLE_LABELS[member.role]} | ${member.department || 'Sem departamento'}`, 14, 42)
  doc.text(`Data do relatório: ${today}`, 14, 48)

  let yPos = 60

  // Stats
  const completedGoals = member.goals.filter(g => g.status === 'completed').length
  const avgProgress = member.goals.length > 0
    ? Math.round(member.goals.reduce((acc, g) => acc + g.progress, 0) / member.goals.length)
    : 0
  const activeHabits = member.habits.filter(h => h.is_active)
  const totalStreak = activeHabits.reduce((acc, h) => acc + (h.current_streak || 0), 0)

  doc.setFontSize(11)
  doc.setTextColor(4, 63, 141)
  doc.text('Resumo', 14, yPos)
  yPos += 8

  doc.setFontSize(9)
  doc.setTextColor(0)
  doc.text(`Total de metas: ${member.goals.length}`, 14, yPos)
  doc.text(`Metas concluídas: ${completedGoals}`, 70, yPos)
  doc.text(`Progresso médio: ${avgProgress}%`, 130, yPos)
  yPos += 6
  doc.text(`Hábitos ativos: ${activeHabits.length}`, 14, yPos)
  doc.text(`Streak total: ${totalStreak} dias`, 70, yPos)
  yPos += 15

  // Goals table
  if (member.goals.length > 0) {
    doc.setFontSize(11)
    doc.setTextColor(4, 63, 141)
    doc.text('Metas', 14, yPos)
    yPos += 5

    const goalsData = member.goals.map(goal => [
      goal.title,
      CATEGORY_LABELS[goal.category],
      PRIORITY_LABELS[goal.priority],
      STATUS_LABELS[goal.status],
      `${goal.progress}%`,
      goal.due_date ? format(new Date(goal.due_date), 'dd/MM/yyyy') : '-',
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Título', 'Categoria', 'Prioridade', 'Status', 'Progresso', 'Prazo']],
      body: goalsData,
      theme: 'grid',
      headStyles: { fillColor: [4, 63, 141] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Habits table
  if (activeHabits.length > 0) {
    if (yPos > 230) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(11)
    doc.setTextColor(4, 63, 141)
    doc.text('Hábitos', 14, yPos)
    yPos += 5

    const habitsData = activeHabits.map(habit => [
      habit.title,
      habit.frequency.join(', '),
      `${habit.current_streak} dias`,
      `${habit.best_streak} dias`,
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Título', 'Frequência', 'Streak Atual', 'Melhor Streak']],
      body: habitsData,
      theme: 'grid',
      headStyles: { fillColor: [4, 63, 141] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`PDI Tracker - ODuo Assessoria | Página ${i} de ${pageCount}`, 14, 287)
  }

  doc.save(`relatorio-pdi-${member.name.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

// Export team data to Excel
export function exportTeamToExcel(teamMembers: TeamMemberReport[], managerName: string) {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = teamMembers.map(member => ({
    Nome: member.name,
    Email: member.email,
    Cargo: member.position || ROLE_LABELS[member.role],
    Departamento: member.department || '-',
    'Total Metas': member.goals.length,
    'Metas Concluídas': member.goals.filter(g => g.status === 'completed').length,
    'Metas em Progresso': member.goals.filter(g => g.status === 'in_progress').length,
    'Metas Atrasadas': member.goals.filter(g => g.status === 'overdue').length,
    'Progresso Médio (%)': member.goals.length > 0
      ? Math.round(member.goals.reduce((acc, g) => acc + g.progress, 0) / member.goals.length)
      : 0,
    'Hábitos Ativos': member.habits.filter(h => h.is_active).length,
    'Streak Total': member.habits.filter(h => h.is_active).reduce((acc, h) => acc + (h.current_streak || 0), 0),
  }))

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')

  // Goals sheet
  const goalsData: any[] = []
  teamMembers.forEach(member => {
    member.goals.forEach(goal => {
      goalsData.push({
        Colaborador: member.name,
        Título: goal.title,
        Descrição: goal.description || '-',
        Categoria: CATEGORY_LABELS[goal.category],
        Prioridade: PRIORITY_LABELS[goal.priority],
        Status: STATUS_LABELS[goal.status],
        'Progresso (%)': goal.progress,
        Prazo: goal.due_date ? format(new Date(goal.due_date), 'dd/MM/yyyy') : '-',
        'Data Criação': format(new Date(goal.created_at), 'dd/MM/yyyy'),
      })
    })
  })

  if (goalsData.length > 0) {
    const goalsSheet = XLSX.utils.json_to_sheet(goalsData)
    XLSX.utils.book_append_sheet(workbook, goalsSheet, 'Metas')
  }

  // Habits sheet
  const habitsData: any[] = []
  teamMembers.forEach(member => {
    member.habits.filter(h => h.is_active).forEach(habit => {
      habitsData.push({
        Colaborador: member.name,
        Título: habit.title,
        Descrição: habit.description || '-',
        Frequência: habit.frequency.join(', '),
        'Streak Atual': habit.current_streak,
        'Melhor Streak': habit.best_streak,
        'Data Criação': format(new Date(habit.created_at), 'dd/MM/yyyy'),
      })
    })
  })

  if (habitsData.length > 0) {
    const habitsSheet = XLSX.utils.json_to_sheet(habitsData)
    XLSX.utils.book_append_sheet(workbook, habitsSheet, 'Hábitos')
  }

  XLSX.writeFile(workbook, `relatorio-pdi-equipe-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}
