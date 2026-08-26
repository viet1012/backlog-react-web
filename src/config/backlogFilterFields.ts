import type { ProductionOrder } from '../types/report'

export const BACKLOG_FILTER_FIELDS = [
  'VBELN', 'ZGLOBAL_CODE', 'PNAME', 'Status', 'CurrentProcess',
  'PIER_AUFNR', 'AUFNR', 'IssueD', 'ProductionD', 'PromiseD',
  'ExportD', 'ORG_Date', 'MSM_Ship', 'RRONYU1', 'ShipBy', 'GAMNG',
  'NETPR', 'PHCD', 'KWMENG', 'RODENK', 'LOEKZ', 'MTO_ID',
  'PRT_ADDCMT1', 'PRT_ADDCMT2', 'PRT_STS', 'Div', 'FERTH',
  'PO_SRG_Convert', 'ToDrill', 'ToHeat', 'ToPK', 'HeatCharge',
  'ProcessQty', 'Z300Qty', 'PkQty', 'FinalQty', 'TimeSQuenching',
  'TimeFHeat', 'C_PRODH', 'C_KEYCONTROL1', 'C_KEYCONTROL3',
  'Updater', 'UpdatedAt',
] as const satisfies readonly (keyof ProductionOrder)[]

export type ExcelFilterField = (typeof BACKLOG_FILTER_FIELDS)[number]
export type BacklogFilterKind = 'text' | 'number' | 'date'

const dateFields = new Set<ExcelFilterField>([
  'IssueD', 'ProductionD', 'PromiseD', 'ExportD', 'ORG_Date',
  'MSM_Ship', 'ToDrill', 'ToHeat', 'ToPK', 'TimeSQuenching',
  'TimeFHeat', 'UpdatedAt',
])

const numberFields = new Set<ExcelFilterField>([
  'GAMNG', 'NETPR', 'KWMENG', 'ProcessQty', 'Z300Qty', 'PkQty', 'FinalQty',
])

export function isExcelFilterField(field: string): field is ExcelFilterField {
  return BACKLOG_FILTER_FIELDS.some((allowedField) => allowedField === field)
}

export function getBacklogFilterKind(field: ExcelFilterField): BacklogFilterKind {
  if (dateFields.has(field)) return 'date'
  if (numberFields.has(field)) return 'number'
  return 'text'
}
