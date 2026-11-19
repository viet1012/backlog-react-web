import type { Messages } from '../../i18n/messages/en'
import type { ReportFilters } from '../../services/reportService'

export function getBacklogFilterLabels(
  t: Messages,
): Record<keyof ReportFilters, string> {
  return {
    search: t.common.search,
    status: t.columns.status,
    div: t.columns.division,
    currentProcess: t.backlog.process,
    shipBy: t.columns.shipBy,
    productionDate: t.columns.productionDate,
  }
}

/** "Tìm kiếm: 4200002732 · Status: FINISHED" – dùng cho cảnh "không tìm thấy" */
export function describeBacklogFilters(
  filters: ReportFilters,
  t: Messages,
): string {
  const labels = getBacklogFilterLabels(t)

  return (Object.entries(filters) as Array<[keyof ReportFilters, string]>)
    .filter(([, value]) => value.trim() !== '')
    .map(([name, value]) => `${labels[name]}: ${value.trim()}`)
    .join(' · ')
}
