import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSubjects } from '../api/subjects'
import { getTasks } from '../api/tasks'
import { CalendarDayCard } from '../components/calendar/CalendarDayCard'
import { CalendarTaskCard } from '../components/calendar/CalendarTaskCard'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useSettings } from '../context/SettingsContext'
import type { Language, Subject, Task } from '../types'
import { groupTasksByLocalDeadline } from '../utils/calendar'
import { getErrorMessage } from '../utils/errors'
import { translate } from '../utils/i18n'

const localeByLanguage: Record<Language, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  uk: 'uk-UA',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ar: 'ar',
  hi: 'hi-IN',
  tr: 'tr-TR',
}

export function CalendarPage() {
  const { settings } = useSettings()
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const language = settings?.language ?? 'en'
  const locale = localeByLanguage[language]

  const loadCalendar = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [taskData, subjectData] = await Promise.all([getTasks(), getSubjects()])
      setTasks(taskData)
      setSubjects(subjectData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCalendar()
  }, [loadCalendar])

  const groups = useMemo(() => groupTasksByLocalDeadline(tasks), [tasks])
  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  )
  const overdueCount = groups.overdue.reduce(
    (count, group) => count + group.tasks.filter((task) => task.status !== 'accepted').length,
    0,
  )
  const upcomingCount = groups.upcoming.reduce((count, group) => count + group.tasks.length, 0)

  return (
    <section className="calendar-page">
      <PageHeader
        title={translate(language, 'calendar')}
        subtitle={translate(language, 'calendarSubtitle')}
      />

      {error ? (
        <div className="app-error-panel mb-4" role="alert">
          <p>{error}</p>
          <button className="btn-secondary" type="button" onClick={() => void loadCalendar()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="calendar-summary" aria-label="Calendar summary">
        <div><span>Overdue</span><strong>{overdueCount}</strong></div>
        <div><span>Due today</span><strong>{groups.today?.tasks.length ?? 0}</strong></div>
        <div><span>Upcoming</span><strong>{upcomingCount}</strong></div>
        <div><span>No deadline</span><strong>{groups.noDeadline.length}</strong></div>
      </div>

      {isLoading ? (
        <div className="card app-muted p-6 text-sm" role="status">Loading calendar...</div>
      ) : !tasks.length ? (
        <EmptyState text="No tasks to place on the calendar yet." />
      ) : (
        <div className="calendar-sections">
          <section className="calendar-period" aria-labelledby="calendar-past-title">
            <div className="calendar-period__heading">
              <div>
                <p className="calendar-period__eyebrow">Review</p>
                <h2 id="calendar-past-title">Past deadlines</h2>
              </div>
              <span>{overdueCount} active overdue</span>
            </div>
            {groups.overdue.length ? groups.overdue.map((group) => (
              <CalendarDayCard key={group.dateKey} group={group} subjectById={subjectById} locale={locale} />
            )) : <EmptyState text="No past deadlines." />}
          </section>

          <section className="calendar-period calendar-period--today" aria-labelledby="calendar-today-title">
            <div className="calendar-period__heading">
              <div>
                <p className="calendar-period__eyebrow">Focus</p>
                <h2 id="calendar-today-title">Today</h2>
              </div>
              <span>{groups.today?.tasks.length ?? 0} due</span>
            </div>
            {groups.today ? (
              <CalendarDayCard group={groups.today} subjectById={subjectById} locale={locale} />
            ) : <EmptyState text="Nothing is due today." />}
          </section>

          <section className="calendar-period" aria-labelledby="calendar-upcoming-title">
            <div className="calendar-period__heading">
              <div>
                <p className="calendar-period__eyebrow">Plan</p>
                <h2 id="calendar-upcoming-title">Upcoming</h2>
              </div>
              <span>{upcomingCount} scheduled</span>
            </div>
            {groups.upcoming.length ? groups.upcoming.map((group) => (
              <CalendarDayCard key={group.dateKey} group={group} subjectById={subjectById} locale={locale} />
            )) : <EmptyState text="No upcoming deadlines." />}
          </section>

          <section className="calendar-period" aria-labelledby="calendar-unscheduled-title">
            <div className="calendar-period__heading">
              <div>
                <p className="calendar-period__eyebrow">Inbox</p>
                <h2 id="calendar-unscheduled-title">Without a deadline</h2>
              </div>
              <span>{groups.noDeadline.length} unscheduled</span>
            </div>
            {groups.noDeadline.length ? (
              <div className="calendar-day__tasks">
                {groups.noDeadline.map((task) => (
                  <CalendarTaskCard
                    key={task.id}
                    task={task}
                    subject={subjectById.get(task.subject_id)}
                    locale={locale}
                  />
                ))}
              </div>
            ) : <EmptyState text="Every task has a deadline." />}
          </section>
        </div>
      )}
    </section>
  )
}
