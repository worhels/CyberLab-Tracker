export type MentorMode = 'lab' | 'code' | 'report' | 'deadline' | 'chat'
export type MentorLanguage = 'auto' | 'ru' | 'uk' | 'en'

export interface MentorChatRequest {
  message: string
  mode: MentorMode
  page: string
  session_id?: string
  subject_id?: number | null
  task_id?: number | null
  language?: MentorLanguage
}

export interface MentorChatResponse {
  answer: string
  session_id: string
}
