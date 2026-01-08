export type UserRole = 'admin' | 'gestor' | 'colaborador'
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue'
export type GoalCategory = 'profissional' | 'pessoal' | 'saude' | 'tecnico'
export type GoalPriority = 'low' | 'medium' | 'high'
export type HabitType = 'boolean' | 'counter' | 'time'
export type NotificationType =
  | 'goal_due_soon'
  | 'goal_overdue'
  | 'goal_completed'
  | 'streak_milestone'
  | 'team_update'
  | 'system'
  // OKR notification types
  | 'okr_approved'
  | 'okr_rejected'
  | 'okr_comment'
  | 'okr_mention'
  | 'okr_checkin_reminder'
  | 'okr_goal_achieved'

export interface Profile {
  id: string
  email: string
  name: string
  role: UserRole
  manager_id: string | null
  avatar_url: string | null
  is_active: boolean
  department: string | null
  position: string | null
  area: string | null
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  category: GoalCategory
  status: GoalStatus
  priority: GoalPriority
  due_date: string | null
  progress: number
  created_at: string
  updated_at: string
}

export interface Habit {
  id: string
  user_id: string
  title: string
  description: string | null
  type: HabitType
  target_value: number
  frequency: string[]
  current_streak: number
  best_streak: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string
  completed: boolean
  value: number
  notes: string | null
  created_at: string
}

export interface Achievement {
  id: string
  user_id: string
  type: string
  habit_id: string | null
  goal_id: string | null
  unlocked_at: string
}

export interface Comment {
  id: string
  goal_id: string | null
  habit_id: string | null
  user_id: string
  content: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  related_goal_id: string | null
  related_habit_id: string | null
  related_user_id: string | null
  created_at: string
}

export interface AdminStats {
  total_users: number
  total_admins: number
  total_gestores: number
  total_colaboradores: number
  total_goals: number
  completed_goals: number
  overdue_goals: number
  in_progress_goals: number
  total_habits: number
  total_achievements: number
  avg_goal_progress: number
}

// Extended types with relations
export interface HabitWithLogs extends Habit {
  habit_logs: HabitLog[]
}

export interface GoalWithComments extends Goal {
  comments: Comment[]
}

export interface ProfileWithManager extends Profile {
  manager: Profile | null
}

export interface TeamMember extends Profile {
  goals: Goal[]
  habits: Habit[]
}

export interface OrgChartNode extends Profile {
  subordinates: OrgChartNode[]
}

export interface ProfileWithSubordinates extends Profile {
  subordinates: Profile[]
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      goals: {
        Row: Goal
        Insert: Omit<Goal, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Goal, 'id' | 'created_at'>>
      }
      habits: {
        Row: Habit
        Insert: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'current_streak' | 'best_streak'>
        Update: Partial<Omit<Habit, 'id' | 'created_at'>>
      }
      habit_logs: {
        Row: HabitLog
        Insert: Omit<HabitLog, 'id' | 'created_at'>
        Update: Partial<Omit<HabitLog, 'id' | 'created_at'>>
      }
      achievements: {
        Row: Achievement
        Insert: Omit<Achievement, 'id' | 'unlocked_at'>
        Update: Partial<Omit<Achievement, 'id'>>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at'>
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>
      }
    }
    Enums: {
      user_role: UserRole
      goal_status: GoalStatus
      goal_category: GoalCategory
      goal_priority: GoalPriority
      habit_type: HabitType
    }
  }
}

// Achievement types
export const ACHIEVEMENT_TYPES = {
  STREAK_7: 'streak_7',
  STREAK_30: 'streak_30',
  STREAK_100: 'streak_100',
  FIRST_GOAL: 'first_goal',
  GOAL_COMPLETED: 'goal_completed',
  FIVE_HABITS: 'five_habits',
  FIRST_CHECKIN: 'first_checkin',
} as const

export const ACHIEVEMENT_INFO: Record<string, { title: string; description: string; icon: string }> = {
  [ACHIEVEMENT_TYPES.STREAK_7]: {
    title: '7 Dias de Fogo',
    description: 'Completou 7 dias consecutivos em um hábito',
    icon: '🔥',
  },
  [ACHIEVEMENT_TYPES.STREAK_30]: {
    title: 'Mês de Disciplina',
    description: 'Completou 30 dias consecutivos em um hábito',
    icon: '💪',
  },
  [ACHIEVEMENT_TYPES.STREAK_100]: {
    title: 'Centenário',
    description: 'Completou 100 dias consecutivos em um hábito',
    icon: '🏆',
  },
  [ACHIEVEMENT_TYPES.FIRST_GOAL]: {
    title: 'Primeiro Passo',
    description: 'Criou sua primeira meta',
    icon: '🎯',
  },
  [ACHIEVEMENT_TYPES.GOAL_COMPLETED]: {
    title: 'Missão Cumprida',
    description: 'Completou uma meta do PDI',
    icon: '✅',
  },
  [ACHIEVEMENT_TYPES.FIVE_HABITS]: {
    title: 'Hábitos em Ação',
    description: 'Criou 5 hábitos ativos',
    icon: '📋',
  },
  [ACHIEVEMENT_TYPES.FIRST_CHECKIN]: {
    title: 'Check-in Inaugural',
    description: 'Fez seu primeiro check-in',
    icon: '🚀',
  },
}

// Category labels
export const CATEGORY_LABELS: Record<GoalCategory, string> = {
  profissional: 'Profissional',
  pessoal: 'Pessoal',
  saude: 'Saúde',
  tecnico: 'Técnico',
}

export const STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: 'Não Iniciada',
  in_progress: 'Em Progresso',
  completed: 'Concluída',
  overdue: 'Atrasada',
}

export const PRIORITY_LABELS: Record<GoalPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

export const HABIT_TYPE_LABELS: Record<HabitType, string> = {
  boolean: 'Sim/Não',
  counter: 'Contador',
  time: 'Tempo (min)',
}

export const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const
export const WEEKDAY_LABELS: Record<string, string> = {
  dom: 'Dom',
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
}

// =====================================================
// INTRANET TYPES - OKRs
// =====================================================

export type OKRLevel = 'company' | 'area' | 'head' | 'individual'
export type OKRStatus = 'draft' | 'pending_validation' | 'approved' | 'rejected' | 'tracking' | 'completed'
export type AreaType = 'vendas' | 'marketing' | 'tech' | 'operacoes' | 'pessoas' | 'financeiro'
export type DepartmentType = 'vendas' | 'marketing' | 'tech' | 'operacoes' | 'pessoas' | 'financeiro'

export const DEPARTMENT_LABELS: Record<DepartmentType, string> = {
  vendas: 'Vendas',
  marketing: 'Marketing',
  tech: 'Tech',
  operacoes: 'Operações',
  pessoas: 'Pessoas',
  financeiro: 'Financeiro',
}

export interface OKRCycle {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Objective {
  id: string
  cycle_id: string
  owner_id: string | null
  parent_objective_id: string | null
  level: OKRLevel
  area: AreaType | null
  title: string
  description: string | null
  status: OKRStatus
  validated_by: string | null
  validated_at: string | null
  validation_notes: string | null
  current_score: number
  final_score: number | null
  created_at: string
  updated_at: string
}

export interface KeyResult {
  id: string
  objective_id: string
  title: string
  description: string | null
  metric_type: string
  start_value: number
  target_value: number
  current_value: number
  unit: string | null
  current_score: number
  position: number
  created_at: string
  updated_at: string
}

export type ConfidenceLevel = 'green' | 'yellow' | 'red'

export interface KRCheckIn {
  id: string
  key_result_id: string
  user_id: string
  check_in_date: string
  previous_value: number | null
  new_value: number
  score: number
  confidence: ConfidenceLevel
  notes: string | null
  blockers: string | null
  created_at: string
}

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  green: 'No caminho',
  yellow: 'Em risco',
  red: 'Fora do caminho',
}

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  green: '#22C55E',
  yellow: '#EAB308',
  red: '#EF4444',
}

export interface OKRComment {
  id: string
  objective_id: string | null
  key_result_id: string | null
  user_id: string
  content: string
  is_validation_feedback: boolean
  created_at: string
}

// Extended OKR types
export interface ObjectiveWithKRs extends Objective {
  key_results: KeyResult[]
  owner?: Profile
  parent?: Objective
  children?: ObjectiveWithKRs[]
}

export interface KeyResultWithCheckIns extends KeyResult {
  check_ins: KRCheckIn[]
}

export interface ObjectiveWithDetails extends ObjectiveWithKRs {
  key_results: KeyResultWithCheckIns[]
  comments: (OKRComment & { user: Profile })[]
}

// OKR Labels
export const OKR_LEVEL_LABELS: Record<OKRLevel, string> = {
  company: 'Empresa',
  area: 'Área',
  head: 'Head',
  individual: 'Individual',
}

export const OKR_STATUS_LABELS: Record<OKRStatus, string> = {
  draft: 'Rascunho',
  pending_validation: 'Aguardando Validação',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  tracking: 'Em Acompanhamento',
  completed: 'Concluído',
}

export const AREA_LABELS: Record<AreaType, string> = {
  vendas: 'Vendas',
  marketing: 'Marketing',
  tech: 'Tech',
  operacoes: 'Operações',
  pessoas: 'Pessoas',
  financeiro: 'Financeiro',
}

export const AREA_COLORS: Record<AreaType, string> = {
  vendas: '#22C55E',
  marketing: '#3B82F6',
  tech: '#8B5CF6',
  operacoes: '#F97316',
  pessoas: '#EAB308',
  financeiro: '#EF4444',
}

// =====================================================
// INTRANET TYPES - COMUNICADOS
// =====================================================

export type AnnouncementScope = 'company' | 'department' | 'team'
export type AnnouncementPriority = 'normal' | 'important' | 'urgent'

export interface AnnouncementCategory {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Announcement {
  id: string
  author_id: string
  title: string
  content: string
  excerpt: string | null
  scope: AnnouncementScope
  priority: AnnouncementPriority
  department: string | null
  is_pinned: boolean
  is_published: boolean
  published_at: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface AnnouncementRead {
  announcement_id: string
  user_id: string
  read_at: string
}

export interface AnnouncementWithDetails extends Announcement {
  author: Profile
  categories: AnnouncementCategory[]
  read_count?: number
  is_read?: boolean
}

export const ANNOUNCEMENT_SCOPE_LABELS: Record<AnnouncementScope, string> = {
  company: 'Empresa',
  department: 'Departamento',
  team: 'Equipe',
}

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  normal: 'Normal',
  important: 'Importante',
  urgent: 'Urgente',
}

export const ANNOUNCEMENT_PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  normal: '#6B7280',
  important: '#F59E0B',
  urgent: '#EF4444',
}

// =====================================================
// INTRANET TYPES - CALENDARIO/EVENTOS
// =====================================================

export type EventType = 'meeting' | 'training' | 'holiday' | 'deadline' | 'personal' | 'team' | 'company'
export type EventVisibility = 'private' | 'team' | 'department' | 'company'
export type RSVPStatus = 'pending' | 'accepted' | 'declined' | 'maybe'

export interface Event {
  id: string
  creator_id: string
  title: string
  description: string | null
  location: string | null
  event_type: EventType
  visibility: EventVisibility
  start_time: string
  end_time: string
  all_day: boolean
  is_recurring: boolean
  recurrence_rule: string | null
  color: string
  department: string | null
  created_at: string
  updated_at: string
}

export interface EventInvitee {
  id: string
  event_id: string
  user_id: string
  rsvp_status: RSVPStatus
  responded_at: string | null
  created_at: string
}

export interface EventWithDetails extends Event {
  creator: Profile
  invitees: (EventInvitee & { user: Profile })[]
  my_rsvp?: RSVPStatus
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: 'Reunião',
  training: 'Treinamento',
  holiday: 'Feriado',
  deadline: 'Prazo',
  personal: 'Pessoal',
  team: 'Equipe',
  company: 'Empresa',
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting: '#3B82F6',
  training: '#8B5CF6',
  holiday: '#22C55E',
  deadline: '#EF4444',
  personal: '#6B7280',
  team: '#F97316',
  company: '#EC4899',
}

export const RSVP_STATUS_LABELS: Record<RSVPStatus, string> = {
  pending: 'Pendente',
  accepted: 'Confirmado',
  declined: 'Recusado',
  maybe: 'Talvez',
}

// =====================================================
// INTRANET TYPES - DIRETORIO (Profile Extended)
// =====================================================

export interface ProfileExtended extends Profile {
  area: AreaType | null
  phone: string | null
  bio: string | null
  skills: string[]
  linkedin_url: string | null
  hire_date: string | null
  office_location: string | null
}

export interface DirectoryFilters {
  search: string
  department: string | null
  area: AreaType | null
  skills: string[]
}

// =====================================================
// INTRANET TYPES - BASE DE CONHECIMENTO
// =====================================================

export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface KBCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string
  color: string | null
  parent_id: string | null
  department: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface KBCategoryWithChildren extends KBCategory {
  children: KBCategoryWithChildren[]
  article_count?: number
}

export interface KBArticle {
  id: string
  category_id: string | null
  author_id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  status: ArticleStatus
  is_featured: boolean
  department: string | null
  view_count: number
  read_time_minutes: number | null
  cover_image: string | null
  tags: string[] | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface KBArticleVersion {
  id: string
  article_id: string
  editor_id: string
  title: string
  content: string
  version_number: number
  change_summary: string | null
  created_at: string
}

export interface KBTag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface KBBookmark {
  article_id: string
  user_id: string
  created_at: string
}

export interface KBArticleWithDetails extends Omit<KBArticle, 'tags'> {
  author: Profile
  category: KBCategory | null
  tags: KBTag[]
  is_bookmarked?: boolean
}

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
}

// =====================================================
// INTRANET TYPES - NOTIFICACOES IN-APP
// =====================================================

export interface InAppNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  link: string | null
  related_user_id: string | null
  is_read: boolean
  created_at: string
}

// =====================================================
// INTRANET TYPES - KPIs
// =====================================================

export type KPIMetricType = 'number' | 'percentage' | 'currency' | 'boolean'
export type KPIFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export interface KPI {
  id: string
  title: string
  description: string | null
  owner_id: string | null
  area: AreaType | null
  metric_type: KPIMetricType
  unit: string | null
  target_value: number | null
  current_value: number
  frequency: KPIFrequency
  linked_objective_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface KPIValue {
  id: string
  kpi_id: string
  value: number
  recorded_at: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface KPIWithValues extends KPI {
  values: KPIValue[]
  owner?: Profile
  linked_objective?: Objective
}

export const KPI_FREQUENCY_LABELS: Record<KPIFrequency, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
}

export const KPI_METRIC_TYPE_LABELS: Record<KPIMetricType, string> = {
  number: 'Numero',
  percentage: 'Percentual',
  currency: 'Valor (R$)',
  boolean: 'Sim/Nao',
}

// =====================================================
// INTRANET TYPES - KPI GOALS (METAS)
// =====================================================

export type GoalTargetOperator = '>' | '<' | '>=' | '<=' | '='
export type KPIGoalStatus = 'active' | 'completed' | 'failed' | 'cancelled'
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface KPIGoal {
  id: string
  kpi_id: string
  title: string
  description: string | null
  target_operator: GoalTargetOperator
  target_value: number
  deadline: string
  status: KPIGoalStatus
  completed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface KPIGoalWithKPI extends KPIGoal {
  kpi?: KPI
  actions?: GoalAction[]
}

export interface GoalAction {
  id: string
  goal_id: string
  what: string
  why: string | null
  where_location: string | null
  when_date: string | null
  who: string | null
  how: string | null
  how_much: number | null
  status: ActionStatus
  completed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GoalActionWithAssignee extends GoalAction {
  assignee?: Profile
}

export const KPI_GOAL_STATUS_LABELS: Record<KPIGoalStatus, string> = {
  active: 'Ativa',
  completed: 'Concluida',
  failed: 'Nao Atingida',
  cancelled: 'Cancelada',
}

export const KPI_GOAL_STATUS_COLORS: Record<KPIGoalStatus, string> = {
  active: '#3B82F6',
  completed: '#22C55E',
  failed: '#EF4444',
  cancelled: '#6B7280',
}

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluida',
  cancelled: 'Cancelada',
}

export const ACTION_STATUS_COLORS: Record<ActionStatus, string> = {
  pending: '#6B7280',
  in_progress: '#3B82F6',
  completed: '#22C55E',
  cancelled: '#EF4444',
}

export const TARGET_OPERATOR_LABELS: Record<GoalTargetOperator, string> = {
  '>': 'Maior que',
  '<': 'Menor que',
  '>=': 'Maior ou igual',
  '<=': 'Menor ou igual',
  '=': 'Igual a',
}

// =====================================================
// PDI TYPES - GOAL TASKS (ATIVIDADES DE METAS)
// =====================================================

export type TaskRecurrenceType = 'daily' | 'weekly' | 'monthly'

export interface GoalTask {
  id: string
  goal_id: string
  title: string
  description: string | null
  is_recurring: boolean
  recurrence_type: TaskRecurrenceType | null
  recurrence_days: number[] | null
  is_completed: boolean
  completed_at: string | null
  weight: number
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GoalTaskCompletion {
  id: string
  task_id: string
  completed_at: string
  notes: string | null
  created_by: string | null
}

export interface GoalTaskWithCompletions extends GoalTask {
  completions?: GoalTaskCompletion[]
}

export const TASK_RECURRENCE_LABELS: Record<TaskRecurrenceType, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

export const WEEKDAY_INDEX_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sab',
}

// =====================================================
// INTRANET TYPES - COMENTARIOS E ANEXOS GENERICOS
// =====================================================

export type EntityType = 'objective' | 'key_result' | 'kpi' | 'comment'
export type ActivityAction = 'created' | 'updated' | 'checked_in' | 'commented' | 'deleted' | 'approved' | 'rejected'

export interface GenericComment {
  id: string
  entity_type: EntityType
  entity_id: string
  author_id: string
  content: string
  parent_comment_id: string | null
  created_at: string
  updated_at: string
}

export interface GenericCommentWithAuthor extends GenericComment {
  author: Profile
  replies?: GenericCommentWithAuthor[]
}

export interface Attachment {
  id: string
  entity_type: EntityType
  entity_id: string
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}

export interface AttachmentWithUploader extends Attachment {
  uploader?: Profile
}

export interface Activity {
  id: string
  entity_type: EntityType
  entity_id: string
  action: ActivityAction
  actor_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ActivityWithActor extends Activity {
  actor?: Profile
}

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  created: 'criou',
  updated: 'atualizou',
  checked_in: 'fez check-in em',
  commented: 'comentou em',
  deleted: 'excluiu',
  approved: 'aprovou',
  rejected: 'rejeitou',
}

// =====================================================
// OKR TYPES - TASKS (TAREFAS DE OKRs)
// =====================================================

export type OKRTaskPriority = 'low' | 'medium' | 'high'

export interface OKRTask {
  id: string
  objective_id: string | null
  key_result_id: string | null
  title: string
  description: string | null
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  priority: OKRTaskPriority
  sort_order: number
  assignee_id: string | null
  due_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OKRTaskWithAssignee extends OKRTask {
  assignee?: Profile
  completed_by_user?: Profile
}

export const OKR_TASK_PRIORITY_LABELS: Record<OKRTaskPriority, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
}

export const OKR_TASK_PRIORITY_COLORS: Record<OKRTaskPriority, string> = {
  low: '#6B7280',
  medium: '#F59E0B',
  high: '#EF4444',
}
