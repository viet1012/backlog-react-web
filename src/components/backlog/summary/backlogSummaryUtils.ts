import type { BacklogStatusSummaryRow } from '../../../services/reportService'
import {
  BACKLOG_STATUS_COLORS,
  normalizeBacklogStatus,
} from '../backlogStatus'

export function getTodayKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getStatusColor(
  status: string,
): string {
  const key = normalizeBacklogStatus(status)

  return (
    BACKLOG_STATUS_COLORS[
      key as keyof typeof BACKLOG_STATUS_COLORS
    ] ?? '#64748b'
  )
}

export function formatDateHeader(
  value: string,
): string {
  const parts = value.split('-')

  if (parts.length !== 3) {
    return value
  }

  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])

  if (
    !Number.isFinite(year)
    || !Number.isFinite(month)
    || !Number.isFinite(day)
  ) {
    return value
  }

  const date = new Date(year, month - 1, day)
  const monthLabel = date.toLocaleString(
    'en-US',
    { month: 'short' },
  )

  return `${day}-${monthLabel}`
}

export function formatNumber(
  value: number | null | undefined,
): string {
  return (value ?? 0).toLocaleString()
}

export function getCell(
  row: BacklogStatusSummaryRow,
  date: string,
): BacklogStatusSummaryRow['values'][number] | undefined {
  return row.values.find(
    (value) => value.date === date,
  )
}
