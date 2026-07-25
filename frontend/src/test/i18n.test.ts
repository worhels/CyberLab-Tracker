import { describe, expect, it } from 'vitest'
import { translate } from '../utils/i18n'
import { applyDocumentLanguage, supportedLanguages } from '../utils/languages'

describe('interface languages', () => {
  it('offers the original languages plus ten additional languages', () => {
    expect(supportedLanguages).toHaveLength(13)
    expect(new Set(supportedLanguages.map((language) => language.code)).size).toBe(13)
  })

  it.each(supportedLanguages.filter(({ code }) => code !== 'en'))(
    'provides native core UI copy for $nativeName',
    ({ code }) => {
      expect(translate(code, 'settings')).not.toBe(translate('en', 'settings'))
      expect(translate(code, 'navTasks')).not.toBe(translate('en', 'navTasks'))
      expect(translate(code, 'mentor.placeholder')).not.toBe(translate('en', 'mentor.placeholder'))
    },
  )

  it('sets document language and right-to-left direction for Arabic', () => {
    applyDocumentLanguage('ar')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')

    applyDocumentLanguage('de')
    expect(document.documentElement.dir).toBe('ltr')
  })
})
