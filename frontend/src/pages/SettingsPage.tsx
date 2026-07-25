import { useState } from 'react'
import { Download, FileJson, FileSpreadsheet, LoaderCircle } from 'lucide-react'
import { getWorkspaceExport, saveWorkspaceExport } from '../api/export'
import type { ExportFormat } from '../api/export'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import type { AccentColor, DashboardView, Language, Theme, UserSettingsPayload } from '../types'
import { getErrorMessage } from '../utils/errors'
import { translate } from '../utils/i18n'
import type { TranslationKey } from '../utils/i18n'
import { supportedLanguages } from '../utils/languages'

const themeOptions: Array<{ value: Theme; labelKey: TranslationKey }> = [
  { value: 'zerkalo', labelKey: 'zerkalo' },
  { value: 'system', labelKey: 'system' },
  { value: 'dark', labelKey: 'dark' },
  { value: 'light', labelKey: 'light' },
]

const accentOptions: Array<{ value: AccentColor; label: string }> = [
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
]

const dashboardViewOptions: Array<{ value: DashboardView; labelKey: TranslationKey }> = [
  { value: 'comfortable', labelKey: 'comfortable' },
  { value: 'compact', labelKey: 'compact' },
]

interface ToggleRowProps {
  checked: boolean
  description: string
  disabled: boolean
  label: string
  onChange: (checked: boolean) => void
}

function ToggleRow({ checked, description, disabled, label, onChange }: ToggleRowProps) {
  return (
    <label className="settings-toggle-row flex items-center justify-between gap-4 rounded-lg px-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-[var(--text-main)]">{label}</span>
        <span className="app-muted mt-1 block text-xs">{description}</span>
      </span>
      <input
        checked={checked}
        className="h-5 w-5 accent-[var(--accent-info)]"
        disabled={disabled}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

export function SettingsPage() {
  const { user } = useAuth()
  const { settings, isLoading, error, updateSettings } = useSettings()
  const [saveError, setSaveError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)

  const saveSettings = async (payload: UserSettingsPayload) => {
    setIsSaving(true)
    setSaveError('')
    setSavedMessage('')
    try {
      const nextSettings = await updateSettings(payload)
      setSavedMessage(translate(nextSettings.language, 'settingsSaved'))
    } catch (err) {
      setSaveError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const isBusy = isLoading || isSaving || !settings
  const language = settings?.language ?? 'en'
  const t = (key: TranslationKey) => translate(language, key)

  const exportWorkspace = async (format: ExportFormat) => {
    setExportingFormat(format)
    setExportError('')
    setExportMessage('')
    try {
      const blob = await getWorkspaceExport(format)
      saveWorkspaceExport(blob, format)
      setExportMessage(t('exportStarted'))
    } catch (err) {
      setExportError(getErrorMessage(err))
    } finally {
      setExportingFormat(null)
    }
  }

  return (
    <section>
      <PageHeader title={t('settings')} label={t('workspace')} subtitle={t('settingsSubtitle')} />

      {error || saveError || exportError ? <p className="app-error mb-4">{error || saveError || exportError}</p> : null}
      {savedMessage ? <p className="mb-4 text-sm text-[var(--accent-ok)]">{savedMessage}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <section className="card p-5">
          <h2 className="app-section-title">{t('account')}</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="label">{t('email')}</dt>
              <dd className="mt-1 text-[var(--text-main)]">{user?.email}</dd>
            </div>
            <div>
              <dt className="label">{t('name')}</dt>
              <dd className="mt-1 text-[var(--text-main)]">{user?.full_name || t('notSet')}</dd>
            </div>
          </dl>
        </section>

        <section className="card p-5">
          <h2 className="app-section-title">{t('interface')}</h2>
          {settings ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="label">{t('language')}</span>
                <select
                  className="field mt-1"
                  disabled={isBusy}
                  value={settings.language}
                  onChange={(event) => void saveSettings({ language: event.target.value as Language })}
                >
                  {supportedLanguages.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.nativeName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="label">{t('theme')}</span>
                <select
                  className="field mt-1"
                  disabled={isBusy}
                  value={settings.theme}
                  onChange={(event) => void saveSettings({ theme: event.target.value as Theme })}
                >
                  {themeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="label">{t('accentColor')}</span>
                <select
                  className="field mt-1"
                  disabled={isBusy}
                  value={settings.accent_color}
                  onChange={(event) => void saveSettings({ accent_color: event.target.value as AccentColor })}
                >
                  {accentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="label">{t('dashboardDensity')}</span>
                <select
                  className="field mt-1"
                  disabled={isBusy}
                  value={settings.dashboard_view}
                  onChange={(event) => void saveSettings({ dashboard_view: event.target.value as DashboardView })}
                >
                  {dashboardViewOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <p className="app-muted mt-5 text-sm">Loading settings...</p>
          )}
        </section>

        <section className="card p-5 xl:col-span-2">
          <h2 className="app-section-title">{t('behavior')}</h2>
          {settings ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <ToggleRow
                checked={settings.show_crisis_cube}
                description={t('crisisCubeDescription')}
                disabled={isBusy}
                label={t('crisisCube')}
                onChange={(checked) => void saveSettings({ show_crisis_cube: checked })}
              />
              <ToggleRow
                checked={settings.reduced_motion}
                description={t('reducedMotionDescription')}
                disabled={isBusy}
                label={t('reducedMotion')}
                onChange={(checked) => void saveSettings({ reduced_motion: checked })}
              />
              <ToggleRow
                checked={settings.deadline_reminders}
                description={t('deadlineRemindersDescription')}
                disabled={isBusy}
                label={t('deadlineReminders')}
                onChange={(checked) => void saveSettings({ deadline_reminders: checked })}
              />
            </div>
          ) : (
            <p className="app-muted mt-5 text-sm">Loading behavior settings...</p>
          )}
        </section>

        <section className="card p-5 xl:col-span-2">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--panel-border)] bg-[var(--surface-soft)] text-[var(--text-muted)]">
                <Download size={18} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <h2 className="app-section-title">{t('dataExport')}</h2>
                <p className="app-muted mt-2 max-w-2xl text-sm">{t('dataExportDescription')}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row" aria-busy={exportingFormat !== null}>
              <button
                className="btn-secondary"
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => void exportWorkspace('json')}
              >
                {exportingFormat === 'json' ? (
                  <LoaderCircle className="confirm-dialog__spinner" size={16} aria-hidden="true" />
                ) : (
                  <FileJson size={16} aria-hidden="true" />
                )}
                {exportingFormat === 'json' ? t('exporting') : t('exportJson')}
              </button>
              <button
                className="btn-secondary"
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => void exportWorkspace('csv')}
              >
                {exportingFormat === 'csv' ? (
                  <LoaderCircle className="confirm-dialog__spinner" size={16} aria-hidden="true" />
                ) : (
                  <FileSpreadsheet size={16} aria-hidden="true" />
                )}
                {exportingFormat === 'csv' ? t('exporting') : t('exportCsv')}
              </button>
            </div>
          </div>
          {exportMessage ? (
            <p className="mt-3 text-sm text-[var(--accent-ok)]" role="status">
              {exportMessage}
            </p>
          ) : null}
        </section>
      </div>
    </section>
  )
}
