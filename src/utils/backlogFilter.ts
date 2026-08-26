import {
  GridLogicOperator,
  type GridFilterModel,
} from '@mui/x-data-grid'
import type { BacklogFilterRequest } from '../services/reportService'

const valueOptionalOperators = new Set(['isEmpty', 'isNotEmpty'])

export function toBacklogFilterRequest(
  model: GridFilterModel,
): BacklogFilterRequest {
  const filters = model.items.reduce<BacklogFilterRequest['filters']>((items, item) => {
    if (item.operator === 'isAnyOf' && Array.isArray(item.value)) {
      const values = item.value
        .map((value) => String(value))

      items.push({ field: item.field, operator: 'in', values })
      return items
    }

    const value = item.value == null ? '' : String(item.value)

    if (!item.field || !item.operator) return items
    if (!valueOptionalOperators.has(item.operator) && value.trim() === '') {
      return items
    }

    items.push({ field: item.field, operator: item.operator, value })
    return items
  }, [])

  return {
    filters,
    logicOperator:
      model.logicOperator === GridLogicOperator.Or ? 'or' : 'and',
  }
}
