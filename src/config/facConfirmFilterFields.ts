import type { FacConfirmRow } from '../types/facConfirm'
import type { ExcelFilterKind } from '../components/common/dataGrid/excelFilterContext'

export const FAC_CONFIRM_FILTER_FIELDS = [
  'ferth', 'productGrp', 'aufnr', 'zglobalCode', 'pname', 'issueD',
  'exportD', 'cusId', 'shipBy', 'mtoId', 'prtAddcmt2', 'currentProcess',
  'finalQty', 'toDrill', 'toHeat', 'heatStart', 'heatFinish', 'toPk',
] as const satisfies readonly (keyof FacConfirmRow)[]

export type FacConfirmFilterField = (typeof FAC_CONFIRM_FILTER_FIELDS)[number]

const dateFields = new Set<FacConfirmFilterField>([
  'issueD', 'exportD', 'toDrill', 'toHeat', 'heatStart', 'heatFinish', 'toPk',
])

export function isFacConfirmFilterField(field: string): field is FacConfirmFilterField {
  return FAC_CONFIRM_FILTER_FIELDS.some((allowedField) => allowedField === field)
}

export function getFacConfirmFilterKind(field: string): ExcelFilterKind {
  if (!isFacConfirmFilterField(field)) return 'text'
  if (field === 'finalQty') return 'number'
  if (dateFields.has(field)) return 'date'
  return 'text'
}
