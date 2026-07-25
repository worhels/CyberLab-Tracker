export interface User {
  id: number
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
}

export interface Token {
  access_token: string
  token_type: 'bearer'
}

export interface Subject {
  id: number
  name: string
  color: string
  teacher: string | null
  semester: string | null
  description: string | null
  user_id: number
  created_at: string
  updated_at: string
}

export type TaskType = 'lab' | 'practice' | 'coursework' | 'exam' | 'other'
export type TaskStatus = 'not_started' | 'in_progress' | 'submitted' | 'accepted' | 'debt'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type Language =
  | 'ru'
  | 'uk'
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'hi'
  | 'tr'
export type Theme = 'light' | 'dark' | 'system' | 'zerkalo'
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red'
export type DashboardView = 'compact' | 'comfortable'

export interface Task {
  id: number
  title: string
  description: string | null
  deadline: string | null
  subject_id: number
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  github_url: string | null
  moodle_url: string | null
  report_file: string | null
  estimated_hours: number | null
  submitted_at: string | null
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export interface DashboardSummary {
  total_subjects: number
  total_tasks: number
  accepted_tasks: number
  in_progress_tasks: number
  debt_tasks: number
  overdue_tasks: number
  progress_percent: number
  nearest_deadline: string | null
}

export interface CrisisTask extends Task {
  crisis_score: number
}

export interface CrisisSeverityCounts {
  critical: number
  high: number
  medium: number
  low: number
}

export interface CrisisDashboard {
  total_tasks: number
  accepted_tasks: number
  active_tasks: number
  completion_ratio: number
  pressure_score: number
  cohesion_score: number
  instability_score: number
  severity_counts: CrisisSeverityCounts
  tasks: CrisisTask[]
}

export interface UserSettings {
  id: number
  user_id: number
  language: Language
  theme: Theme
  accent_color: AccentColor
  dashboard_view: DashboardView
  show_crisis_cube: boolean
  reduced_motion: boolean
  deadline_reminders: boolean
}

export interface UserSettingsPayload {
  language?: Language
  theme?: Theme
  accent_color?: AccentColor
  dashboard_view?: DashboardView
  show_crisis_cube?: boolean
  reduced_motion?: boolean
  deadline_reminders?: boolean
}

export interface SubjectCreatePayload {
  name: string
  color?: string
  teacher?: string | null
  semester?: string | null
  description?: string | null
}

export interface SubjectUpdatePayload {
  name?: string
  color?: string
  teacher?: string | null
  semester?: string | null
  description?: string | null
}

export interface TaskCreatePayload {
  title: string
  description?: string | null
  deadline?: string | null
  subject_id: number
  type?: TaskType
  priority?: TaskPriority
  status?: TaskStatus
  github_url?: string | null
  moodle_url?: string | null
  report_file?: string | null
  estimated_hours?: number | null
  submitted_at?: string | null
  accepted_at?: string | null
}

export interface TaskUpdatePayload {
  title?: string
  description?: string | null
  deadline?: string | null
  subject_id?: number
  type?: TaskType
  priority?: TaskPriority
  status?: TaskStatus
  github_url?: string | null
  moodle_url?: string | null
  report_file?: string | null
  estimated_hours?: number | null
  submitted_at?: string | null
  accepted_at?: string | null
}
