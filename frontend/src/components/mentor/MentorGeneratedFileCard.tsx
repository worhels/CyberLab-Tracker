import { Download, FileCode2 } from 'lucide-react'
import type { Language } from '../../types'
import type { MentorGeneratedFile } from '../../utils/mentorFiles'

interface MentorGeneratedFileCardProps {
  file: MentorGeneratedFile
  language: Language
  onDownload: () => void
}

const copy = {
  ru: { ready: 'Файл готов', download: 'Скачать' },
  uk: { ready: 'Файл готовий', download: 'Завантажити' },
  en: { ready: 'File ready', download: 'Download' },
  es: { ready: 'Archivo listo', download: 'Descargar' },
  fr: { ready: 'Fichier prêt', download: 'Télécharger' },
  de: { ready: 'Datei bereit', download: 'Herunterladen' },
  pt: { ready: 'Ficheiro pronto', download: 'Transferir' },
  zh: { ready: '文件已就绪', download: '下载' },
  ja: { ready: 'ファイルの準備完了', download: 'ダウンロード' },
  ko: { ready: '파일 준비 완료', download: '다운로드' },
  ar: { ready: 'الملف جاهز', download: 'تنزيل' },
  hi: { ready: 'फ़ाइल तैयार है', download: 'डाउनलोड' },
  tr: { ready: 'Dosya hazır', download: 'İndir' },
} as const

function formatFileSize(sizeBytes: number, language: Language): string {
  if (sizeBytes < 1_024) return `${sizeBytes} B`
  return `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(sizeBytes / 1_024)} KB`
}

export function MentorGeneratedFileCard({
  file,
  language,
  onDownload,
}: MentorGeneratedFileCardProps) {
  const labels = copy[language]

  return (
    <article className="w-full rounded-[var(--r-md)] border border-[rgba(var(--accent-primary-rgb),0.34)] bg-[var(--surface-soft)] p-3 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--r-sm)] bg-[rgba(var(--accent-primary-rgb),0.12)] text-[var(--accent-primary)]">
          <FileCode2 aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--text-faint)]">
            {labels.ready}
          </p>
          <p className="truncate text-xs font-bold text-[var(--text-main)]" title={file.name}>
            {file.name}
          </p>
        </div>
        <span className="shrink-0 text-[10px] tabular-nums text-[var(--text-faint)]">
          {formatFileSize(file.sizeBytes, language)}
        </span>
      </div>
      <button
        type="button"
        onClick={onDownload}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[var(--r-full)] bg-[var(--accent-primary)] px-4 py-2 text-xs font-bold text-[var(--accent-contrast)] shadow-[var(--shadow-active)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
        aria-label={`${labels.download} ${file.name}`}
      >
        <Download aria-hidden="true" size={14} />
        {labels.download} {file.name}
      </button>
    </article>
  )
}
