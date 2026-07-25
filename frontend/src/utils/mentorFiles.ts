export interface MentorGeneratedFile {
  id: string
  name: string
  content: string
  mimeType: string
  sizeBytes: number
}

const fileRequestPatterns = [
  /(?:создай|сделай|сгенерируй|подготовь|собери)[\s\S]{0,100}(?:файл|архив|скрипт|код|проект)/i,
  /(?:створи|зроби|згенеруй|підготуй|збери)[\s\S]{0,100}(?:файл|архів|скрипт|код|проєкт)/i,
  /\b(?:create|make|generate|prepare|build)\b[\s\S]{0,100}\b(?:file|archive|script|code|project)\b/i,
  /(?:crea|crear|genera|generar|prepara|preparar)[\s\S]{0,100}(?:archivo|fichero|script|código|proyecto)/i,
  /(?:crée|créer|génère|générer|prépare|préparer)[\s\S]{0,100}(?:fichier|archive|script|code|projet)/i,
  /(?:erstelle|erstellen|generiere|generieren|bereite|vorbereiten)[\s\S]{0,100}(?:datei|archiv|skript|code|projekt)/i,
  /(?:crie|criar|gere|gerar|prepare|preparar)[\s\S]{0,100}(?:ficheiro|arquivo|script|código|projeto)/i,
  /(?:创建|生成|制作|准备)[\s\S]{0,100}(?:文件|压缩包|脚本|代码|项目)/,
  /(?:作成|作って|生成|用意)[\s\S]{0,100}(?:ファイル|アーカイブ|スクリプト|コード|プロジェクト)/,
  /(?:ファイル|アーカイブ|スクリプト|コード|プロジェクト)[\s\S]{0,100}(?:作成|作って|生成|用意)/,
  /(?:만들어|생성|작성|준비)[\s\S]{0,100}(?:파일|압축|스크립트|코드|프로젝트)/,
  /(?:파일|압축|스크립트|코드|프로젝트)[\s\S]{0,100}(?:만들어|생성|작성|준비)/,
  /(?:أنشئ|أنشأ|إنشاء|جهز|ولّد)[\s\S]{0,100}(?:ملف|أرشيف|برنامج نصي|كود|مشروع)/,
  /(?:बनाओ|बनाएं|तैयार|जनरेट)[\s\S]{0,100}(?:फ़ाइल|फाइल|संग्रह|स्क्रिप्ट|कोड|प्रोजेक्ट)/,
  /(?:फ़ाइल|फाइल|संग्रह|स्क्रिप्ट|कोड|प्रोजेक्ट)[\s\S]{0,100}(?:बनाओ|बनाएं|तैयार|जनरेट)/,
  /(?:oluştur|hazırla|üret|yap)[\s\S]{0,100}(?:dosya|arşiv|betik|kod|proje)/i,
  /(?:dosya|arşiv|betik|kod|proje)[\s\S]{0,100}(?:oluştur|hazırla|üret|yap)/i,
  /\b(?:файл|file)\b[\s\S]{0,60}\b(?:скачать|завантажити|download)\b/i,
]

const extensionByLanguage: Record<string, string> = {
  bash: 'sh',
  css: 'css',
  csv: 'csv',
  html: 'html',
  javascript: 'js',
  js: 'js',
  json: 'json',
  jsx: 'jsx',
  markdown: 'md',
  md: 'md',
  powershell: 'ps1',
  python: 'py',
  py: 'py',
  sql: 'sql',
  text: 'txt',
  ts: 'ts',
  tsx: 'tsx',
  typescript: 'ts',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yml',
}

const mimeTypeByExtension: Record<string, string> = {
  css: 'text/css',
  csv: 'text/csv',
  html: 'text/html',
  js: 'text/javascript',
  json: 'application/json',
  md: 'text/markdown',
  py: 'text/x-python',
  sql: 'application/sql',
  txt: 'text/plain',
  xml: 'application/xml',
  yaml: 'application/yaml',
  yml: 'application/yaml',
}

export function isMentorFileRequest(message: string): boolean {
  return fileRequestPatterns.some((pattern) => pattern.test(message))
}

function sanitizeFileName(value: string, fallback: string): string {
  const withoutControlCharacters = Array.from(value)
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('')
  const withoutMetadata = withoutControlCharacters
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
  if (!withoutMetadata || withoutMetadata === '.' || withoutMetadata === '..') return fallback
  return withoutMetadata.slice(0, 120)
}

function getMimeType(fileName: string): string {
  const extension = fileName.split('.').at(-1)?.toLowerCase() ?? ''
  return mimeTypeByExtension[extension] ?? 'text/plain'
}

function createGeneratedFile(name: string, content: string, index: number): MentorGeneratedFile {
  return {
    id: `${index}-${name}-${content.length}`,
    name,
    content,
    mimeType: getMimeType(name),
    sizeBytes: new TextEncoder().encode(content).byteLength,
  }
}

export function extractMentorGeneratedFiles(answer: string): MentorGeneratedFile[] {
  const files: MentorGeneratedFile[] = []
  const fencePattern = /```([^\r\n`]*)\r?\n([\s\S]*?)```/g
  let match: RegExpExecArray | null

  while ((match = fencePattern.exec(answer)) !== null) {
    const info = match[1].trim()
    const language = info.split(/\s+/, 1)[0]?.toLowerCase() ?? ''
    const precedingText = answer.slice(Math.max(0, match.index - 180), match.index)
    const headerMatch = precedingText.match(/(?:^|\n)(?:FILE|ФАЙЛ):\s*([^\r\n]+)\s*$/i)
    const infoNameMatch = info.match(/(?:filename|file)\s*=\s*["']?([^\s"']+)/i)
    const extension = extensionByLanguage[language] ?? 'txt'
    const fallbackName = `mentor-file-${files.length + 1}.${extension}`
    const requestedName = headerMatch?.[1] ?? infoNameMatch?.[1] ?? fallbackName
    const fileName = sanitizeFileName(requestedName, fallbackName)
    files.push(createGeneratedFile(fileName, match[2].replace(/\r?\n$/, ''), files.length))
  }

  return files
}

export function createMentorTextFile(answer: string): MentorGeneratedFile {
  return createGeneratedFile('mentor-response.txt', answer.trim(), 0)
}

export function saveMentorGeneratedFile(file: MentorGeneratedFile): void {
  const url = URL.createObjectURL(new Blob([file.content], { type: `${file.mimeType};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  window.setTimeout(() => {
    link.remove()
    URL.revokeObjectURL(url)
  }, 1_000)
}
