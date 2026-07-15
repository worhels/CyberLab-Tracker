import { Download, FileArchive } from 'lucide-react'
import type { Language } from '../../types'
import type { MentorArtifact } from '../../types/mentor'
import { translate } from '../../utils/i18n'
import type { TranslationKey } from '../../utils/i18n'

interface MentorArtifactCardProps {
  artifact: MentorArtifact
  language: Language
  isDownloading: boolean
  downloadError?: string
  onDownload: () => void
}

function formatFileSize(sizeBytes: number, language: Language) {
  const normalizedSize = Math.max(0, sizeBytes)
  if (normalizedSize < 1_024) return `${normalizedSize} B`

  const units = ['KB', 'MB', 'GB'] as const
  let value = normalizedSize / 1_024
  let unitIndex = 0
  while (value >= 1_024 && unitIndex < units.length - 1) {
    value /= 1_024
    unitIndex += 1
  }

  return `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(value)} ${units[unitIndex]}`
}

function formatCreatedAt(value: string, language: Language) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function MentorArtifactCard({
  artifact,
  language,
  isDownloading,
  downloadError,
  onDownload,
}: MentorArtifactCardProps) {
  const t = (key: TranslationKey) => translate(language, key)

  return (
    <article className="rounded-[var(--r-md)] border border-[var(--panel-border)] bg-[var(--surface-soft)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
            <FileArchive aria-hidden="true" size={17} />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
              {artifact.template}
            </span>
          </div>
          <h3 className="mt-2 break-words text-sm font-bold text-[var(--text-main)]">
            {artifact.title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            {artifact.description}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--panel-border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-bold text-[var(--text-muted)]">
          #{artifact.id}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-[var(--r-sm)] border border-[var(--panel-border)] bg-[var(--surface)] p-2.5">
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
            {t('mentor.artifact.defaultRounds')}
          </dt>
          <dd className="mt-1 font-bold tabular-nums text-[var(--text-main)]">
            {artifact.default_rounds}
          </dd>
        </div>
        <div className="rounded-[var(--r-sm)] border border-[var(--panel-border)] bg-[var(--surface)] p-2.5">
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
            {t('mentor.artifact.created')}
          </dt>
          <dd className="mt-1 text-[var(--text-main)]">
            {formatCreatedAt(artifact.created_at, language)}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-bold text-[var(--text-main)]">
            {t('mentor.artifact.files')}
          </h4>
          <span className="text-[10px] font-bold tabular-nums text-[var(--text-faint)]">
            {artifact.files.length}
          </span>
        </div>
        <ul className="mt-2 space-y-2">
          {artifact.files.map((file) => (
            <li
              key={file.id}
              className="rounded-[var(--r-sm)] border border-[var(--panel-border)] bg-[var(--surface)] px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <code className="min-w-0 break-all text-[11px] font-semibold text-[var(--text-main)]">
                  {file.path}
                </code>
                <span className="shrink-0 text-[10px] tabular-nums text-[var(--text-faint)]">
                  {formatFileSize(file.size_bytes, language)}
                </span>
              </div>
              <p
                className="mt-1 truncate font-mono text-[9px] text-[var(--text-faint)]"
                aria-label={`SHA-256 ${file.sha256}`}
                title={file.sha256}
              >
                SHA-256 {file.sha256}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        disabled={isDownloading}
        onClick={onDownload}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[var(--r-full)] bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-bold text-[var(--accent-contrast)] shadow-[var(--shadow-active)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download aria-hidden="true" size={15} />
        {isDownloading ? t('mentor.action.downloading') : t('mentor.action.download')}
      </button>

      {downloadError ? (
        <p className="mt-2 text-xs leading-5 text-[var(--accent-debt)]" role="alert">
          {downloadError}
        </p>
      ) : null}
    </article>
  )
}
