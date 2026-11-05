import { Menu, MenuItem } from '@mui/material'
import { useI18n } from '../../../i18n/useI18n'
import type { ExcelFilterKind } from './excelFilterContext'
import type { FilterCondition } from './excelFilterConditions'

const conditions: Record<ExcelFilterKind, FilterCondition[]> = {
  text: [
    { labelKey: 'equals', operator: 'equals', requiresValue: true },
    { labelKey: 'doesNotEqual', operator: 'doesNotEqual', requiresValue: true },
    { labelKey: 'beginsWith', operator: 'startsWith', requiresValue: true },
    { labelKey: 'endsWith', operator: 'endsWith', requiresValue: true },
    { labelKey: 'contains', operator: 'contains', requiresValue: true },
    { labelKey: 'doesNotContain', operator: 'doesNotContain', requiresValue: true },
    { labelKey: 'isEmpty', operator: 'isEmpty', requiresValue: false },
    { labelKey: 'isNotEmpty', operator: 'isNotEmpty', requiresValue: false },
  ],
  number: [
    { labelKey: 'equals', operator: '=', requiresValue: true },
    { labelKey: 'doesNotEqual', operator: '!=', requiresValue: true },
    { labelKey: 'greaterThan', operator: '>', requiresValue: true },
    { labelKey: 'greaterOrEqual', operator: '>=', requiresValue: true },
    { labelKey: 'lessThan', operator: '<', requiresValue: true },
    { labelKey: 'lessOrEqual', operator: '<=', requiresValue: true },
  ],
  date: [
    { labelKey: 'equals', operator: 'equals', requiresValue: true },
    { labelKey: 'before', operator: 'before', requiresValue: true },
    { labelKey: 'after', operator: 'after', requiresValue: true },
  ],
}

interface ExcelFilterConditionMenuProps {
  anchorEl: HTMLElement | null
  kind: ExcelFilterKind
  onClose: () => void
  onSelect: (condition: FilterCondition) => void
}

export function ExcelFilterConditionMenu({
  anchorEl,
  kind,
  onClose,
  onSelect,
}: ExcelFilterConditionMenuProps) {
  const { t } = useI18n()

  return (
    <Menu
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { minWidth: 220 } } }}
    >
      {conditions[kind].map((condition) => (
        <MenuItem
          key={condition.operator}
          onClick={() => {
            onSelect(condition)
            onClose()
          }}
        >
          {t.dataGrid.conditions[condition.labelKey]}
          {condition.requiresValue ? '...' : ''}
        </MenuItem>
      ))}
    </Menu>
  )
}
