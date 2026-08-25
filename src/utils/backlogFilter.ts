import {
  GridLogicOperator,
  type GridFilterModel,
} from '@mui/x-data-grid'
import type { BacklogFilterRequest } from '../services/reportService'

const valueOptionalOperators = new Set(['isEmpty', 'isNotEmpty'])

export function toBacklogFilterRequest(
  model: GridFilterModel,
): BacklogFilterRequest {
  const filters = model.items.flatMap((item) => {
    const value = item.value == null ? '' : String(item.value)

    if (!item.field || !item.operator) return []
    if (!valueOptionalOperators.has(item.operator) && value.trim() === '') {
      return []
    }

    return [{ field: item.field, operator: item.operator, value }]
  })

  return {
    filters,
    logicOperator:
      model.logicOperator === GridLogicOperator.Or ? 'or' : 'and',
  }
}
