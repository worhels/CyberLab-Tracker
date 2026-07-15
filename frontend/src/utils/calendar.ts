import type { Task } from '../types'

export type CalendarPeriod = 'overdue' | 'today' | 'upcoming'

export interface CalendarDayGroup {
  dateKey: string
  date: Date
  period: CalendarPeriod
  tasks: Task[]
}

export interface CalendarTaskGroups {
  overdue: CalendarDayGroup[]
  today: CalendarDayGroup | null
  upcoming: CalendarDayGroup[]
  noDeadline: Task[]
}

export function toLocalDateKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function compareTasksByDeadline(left: Task, right: Task): number {
  const leftTime = left.deadline ? new Date(left.deadline).getTime() : Number.POSITIVE_INFINITY
  const rightTime = right.deadline ? new Date(right.deadline).getTime() : Number.POSITIVE_INFINITY
  return leftTime - rightTime || left.id - right.id
}

export function groupTasksByLocalDeadline(
  tasks: readonly Task[],
  now = new Date(),
): CalendarTaskGroups {
  const groupsByDate = new Map<string, { date: Date; tasks: Task[] }>()
  const noDeadline: Task[] = []

  for (const task of tasks) {
    if (!task.deadline) {
      noDeadline.push(task)
      continue
    }

    const deadline = new Date(task.deadline)
    if (Number.isNaN(deadline.getTime())) {
      noDeadline.push(task)
      continue
    }

    const date = toLocalDay(deadline)
    const dateKey = toLocalDateKey(date)
    const existingGroup = groupsByDate.get(dateKey)
    if (existingGroup) {
      existingGroup.tasks.push(task)
    } else {
      groupsByDate.set(dateKey, { date, tasks: [task] })
    }
  }

  const todayTime = toLocalDay(now).getTime()
  const dayGroups = [...groupsByDate.entries()]
    .sort(([, left], [, right]) => left.date.getTime() - right.date.getTime())
    .map<CalendarDayGroup>(([dateKey, group]) => {
      const dateTime = group.date.getTime()
      const period: CalendarPeriod = dateTime < todayTime
        ? 'overdue'
        : dateTime === todayTime
          ? 'today'
          : 'upcoming'

      return {
        dateKey,
        date: group.date,
        period,
        tasks: group.tasks.sort(compareTasksByDeadline),
      }
    })

  return {
    overdue: dayGroups.filter((group) => group.period === 'overdue'),
    today: dayGroups.find((group) => group.period === 'today') ?? null,
    upcoming: dayGroups.filter((group) => group.period === 'upcoming'),
    noDeadline,
  }
}
