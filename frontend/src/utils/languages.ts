import type { Language } from '../types'

export interface SupportedLanguage {
  code: Language
  nativeName: string
}

export const supportedLanguages: readonly SupportedLanguage[] = [
  { code: 'ru', nativeName: 'Русский' },
  { code: 'uk', nativeName: 'Українська' },
  { code: 'en', nativeName: 'English' },
  { code: 'es', nativeName: 'Español' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'pt', nativeName: 'Português' },
  { code: 'zh', nativeName: '中文' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'ar', nativeName: 'العربية' },
  { code: 'hi', nativeName: 'हिन्दी' },
  { code: 'tr', nativeName: 'Türkçe' },
] as const

export function applyDocumentLanguage(language: Language): void {
  document.documentElement.lang = language
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
}
