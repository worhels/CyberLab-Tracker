export interface MentorPageContext {
  subjectId?: number
  taskId?: number
}

function parsePositiveInteger(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) return undefined
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

export function getMentorPageContext(search: string): MentorPageContext {
  const searchParams = new URLSearchParams(search)
  return {
    subjectId: parsePositiveInteger(searchParams.get('subject_id')),
    taskId: parsePositiveInteger(searchParams.get('task_id')),
  }
}

export function buildMentorContextSearchParams(
  current: URLSearchParams,
  context: MentorPageContext,
): URLSearchParams {
  const next = new URLSearchParams(current)

  if (context.subjectId === undefined) {
    next.delete('subject_id')
  } else {
    next.set('subject_id', String(context.subjectId))
  }

  if (context.taskId === undefined) {
    next.delete('task_id')
  } else {
    next.set('task_id', String(context.taskId))
  }

  return next
}
