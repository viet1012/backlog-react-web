import {
  GridLogicOperator,
  type GridFilterModel,
} from '@mui/x-data-grid'

import type {
  BacklogFilterRequest,
} from '../services/reportService'


const valueOptionalOperators =
  new Set([
    'isEmpty',
    'isNotEmpty',
  ])


export function toBacklogFilterRequest(
  model: GridFilterModel,
): BacklogFilterRequest {

  const filters =
    model.items.reduce<
      BacklogFilterRequest['filters']
    >(
      (items, item) => {

        if (
          !item.field
          || !item.operator
        ) {
          return items
        }


        // =====================================================
        // EXCEL MULTI SELECT
        // =====================================================

        if (
          item.operator === 'isAnyOf'
          && Array.isArray(item.value)
        ) {

          const values =
            item.value
              .map((value) =>
                String(value),
              )
              .filter(
                (value) =>
                  value !== '',
              )


          if (
            values.length === 0
          ) {
            return items
          }


          items.push({
            field:
              item.field,

            operator:
              'isAnyOf',

            values,
          })


          return items
        }


        // =====================================================
        // NORMAL FILTER
        // =====================================================

        const value =
          item.value == null
            ? ''
            : String(
              item.value,
            )


        if (
          !valueOptionalOperators.has(
            item.operator,
          )
          && value.trim() === ''
        ) {
          return items
        }


        items.push({
          field:
            item.field,

          operator:
            item.operator,

          value,
        })


        return items
      },
      [],
    )


  return {
    filters,

    logicOperator:
      model.logicOperator ===
        GridLogicOperator.Or
        ? 'or'
        : 'and',
  }
}