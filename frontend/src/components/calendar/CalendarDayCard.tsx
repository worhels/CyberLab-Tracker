import type { CalendarDayGroup } from '../../utils/calendar'
import type { Subject } from '../../types'
import { CalendarTaskCard } from './CalendarTaskCard'

interface CalendarDayCardProps {
  group: CalendarDayGroup
  subjectById: ReadonlyMap<number, Subject>
  locale: string
}

export function CalendarDayCard({ group, subjectById, locale }: CalendarDayCardProps) {
  const label = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(group.date)

  return (
    <section className={`calendar-day calendar-day--${group.period}`} aria-labelledby={`calendar-${group.dateKey}`}>
      <header className="calendar-day__header">
        <time id={`calendar-${group.dateKey}`} dateTime={group.dateKey}>{label}</time>
        <span>{group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}</span>
      </header>
      <div className="calendar-day__tasks">
        {group.tasks.map((task) => (
          <CalendarTaskCard
            key={task.id}
            task={task}
            subject={subjectById.get(task.subject_id)}
            isPastDate={group.period === 'overdue'}
            locale={locale}
          />
        ))}
      </div>
    </section>
  )
}
