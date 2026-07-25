import { describe, expect, it, vi } from 'vitest'
import {
  createMentorTextFile,
  extractMentorGeneratedFiles,
  isMentorFileRequest,
  saveMentorGeneratedFile,
} from '../utils/mentorFiles'

describe('mentor generated files', () => {
  it('detects explicit file creation requests in supported languages', () => {
    expect(isMentorFileRequest('сделай мне файл с кодом калькулятора')).toBe(true)
    expect(isMentorFileRequest('Створи файл зі скриптом')).toBe(true)
    expect(isMentorFileRequest('Create a Python file')).toBe(true)
    expect(isMentorFileRequest('Crea un archivo con código')).toBe(true)
    expect(isMentorFileRequest('Crée un fichier avec du code')).toBe(true)
    expect(isMentorFileRequest('Erstelle eine Datei mit Code')).toBe(true)
    expect(isMentorFileRequest('Crie um ficheiro com código')).toBe(true)
    expect(isMentorFileRequest('创建一个代码文件')).toBe(true)
    expect(isMentorFileRequest('コードファイルを作成してください')).toBe(true)
    expect(isMentorFileRequest('코드 파일을 만들어 주세요')).toBe(true)
    expect(isMentorFileRequest('أنشئ ملفًا يحتوي على كود')).toBe(true)
    expect(isMentorFileRequest('कोड वाली फ़ाइल बनाएं')).toBe(true)
    expect(isMentorFileRequest('Kod içeren bir dosya oluştur')).toBe(true)
    expect(isMentorFileRequest('Explain this code')).toBe(false)
  })

  it('extracts multiple named fenced files and sanitizes paths', () => {
    const files = extractMentorGeneratedFiles([
      'FILE: ../calculator.py',
      '```python',
      'print(2 + 2)',
      '```',
      'FILE: README.md',
      '```markdown',
      '# Calculator',
      '```',
    ].join('\n'))

    expect(files).toHaveLength(2)
    expect(files[0]).toMatchObject({ name: '..-calculator.py', content: 'print(2 + 2)' })
    expect(files[1]).toMatchObject({ name: 'README.md', content: '# Calculator' })
  })

  it('infers a safe fallback filename from the fence language', () => {
    expect(extractMentorGeneratedFiles('```typescript\nconst ready = true\n```')[0].name)
      .toBe('mentor-file-1.ts')
  })

  it('starts a browser download and releases the temporary URL', () => {
    const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
    const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')
    const createObjectUrl = vi.fn(() => 'blob:mentor-file')
    const revokeObjectUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.useFakeTimers()

    try {
      const file = createMentorTextFile('ready')
      saveMentorGeneratedFile(file)

      expect(createObjectUrl).toHaveBeenCalledOnce()
      expect(click).toHaveBeenCalledOnce()
      expect(document.querySelector('a[download="mentor-response.txt"]')).not.toBeNull()

      vi.runAllTimers()
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:mentor-file')
      expect(document.querySelector('a[download="mentor-response.txt"]')).toBeNull()
    } finally {
      vi.useRealTimers()
      click.mockRestore()
      if (originalCreateObjectUrl) {
        Object.defineProperty(URL, 'createObjectURL', originalCreateObjectUrl)
      } else {
        Reflect.deleteProperty(URL, 'createObjectURL')
      }
      if (originalRevokeObjectUrl) {
        Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl)
      } else {
        Reflect.deleteProperty(URL, 'revokeObjectURL')
      }
    }
  })
})
