import type { Messages } from '../../../i18n/messages/en'

export type FilterConditionKey = keyof Messages['dataGrid']['conditions']

export interface FilterCondition {
  labelKey: FilterConditionKey
  operator: string
  requiresValue: boolean
}

// Operator → label key, shared by the condition menu and the condition view header.
export const conditionLabelKeys: Record<string, FilterConditionKey> = {
  equals: 'equals',
  doesNotEqual: 'doesNotEqual',
  startsWith: 'beginsWith',
  endsWith: 'endsWith',
  contains: 'contains',
  doesNotContain: 'doesNotContain',
  isEmpty: 'isEmpty',
  isNotEmpty: 'isNotEmpty',
  '=': 'equals',
  '!=': 'doesNotEqual',
  '>': 'greaterThan',
  '>=': 'greaterOrEqual',
  '<': 'lessThan',
  '<=': 'lessOrEqual',
  before: 'before',
  after: 'after',
  onOrAfter: 'onOrAfter',
  onOrBefore: 'onOrBefore',
}
