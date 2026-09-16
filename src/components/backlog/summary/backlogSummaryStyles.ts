export const STATUS_COLUMN_WIDTH = 110
export const DATE_COLUMN_WIDTH = 100

export function getSummaryGridTemplate(
  dateCount: number,
): string {
  return `${STATUS_COLUMN_WIDTH}px repeat(${dateCount}, minmax(${DATE_COLUMN_WIDTH}px, 1fr))`
}
