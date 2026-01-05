export type UserRole = 'admin' | 'gestor' | 'colaborador'
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue'
export type GoalCategory = 'profissional' | 'pessoal' | 'saude' | 'tecnico'
export type GoalPriority = 'low' | 'medium' | 'high'
export type HabitType = 'boolean' | 'counter' | 'time'

export interface Profile {
  id: string
  email: string
  name: string
  role: UserRole
  manager_id: string | null
  avatar_url: string | null
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
