export const ISSUE_TYPES = ['bug', 'feature', 'task'] as const
export type IssueType = (typeof ISSUE_TYPES)[number]

export const ISSUE_PRIORITIES = ['low', 'medium', 'high'] as const
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number]

export const ISSUE_STATUSES = ['open', 'in_progress', 'done'] as const
export type IssueStatus = (typeof ISSUE_STATUSES)[number]

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  bug: 'Bug',
  feature: 'Feature',
  task: 'Task',
}

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  done: 'Done',
}
