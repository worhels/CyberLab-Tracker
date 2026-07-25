export type MentorLanguage = import('./index').Language
export type MentorArtifactLanguage = 'ru' | 'uk' | 'en'
export type MentorArtifactTemplate = 'bcrypt-timing-web-v1'

export interface MentorChatRequest {
  message: string
  page: string
  session_id?: string
  subject_id?: number | null
  task_id?: number | null
  language: MentorLanguage
}

export interface MentorChatResponse {
  answer: string
  session_id: string
}

export interface MentorArtifactCreateRequest {
  template: MentorArtifactTemplate
  goal: string
  language: MentorArtifactLanguage
  task_id?: number
}

export interface MentorArtifactFile {
  id: string
  path: string
  size_bytes: number
  sha256: string
}

export interface MentorArtifact {
  id: string
  template: MentorArtifactTemplate
  title: string
  description: string
  default_rounds: number
  language: MentorArtifactLanguage
  created_at: string
  files: MentorArtifactFile[]
}
