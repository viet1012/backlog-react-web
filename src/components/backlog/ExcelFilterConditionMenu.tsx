import { Menu, MenuItem } from '@mui/material'
import type { BacklogFilterKind } from '../../config/backlogFilterFields'

export interface FilterCondition {
  label: string
  operator: string
  requiresValue: boolean
}

const conditions: Record<BacklogFilterKind, FilterCondition[]> = {
  text: [
    { label: 'Equals...', operator: 'equals', requiresValue: true },
    { label: 'Does Not Equal...', operator: 'doesNotEqual', requiresValue: true },
    { label: 'Begins With...', operator: 'startsWith', requiresValue: true },
    { label: 'Ends With...', operator: 'endsWith', requiresValue: true },
    { label: 'Contains...', operator: 'contains', requiresValue: true },
    { label: 'Does Not Contain...', operator: 'doesNotContain', requiresValue: true },
    { label: 'Is Empty', operator: 'isEmpty', requiresValue: false },
    { label: 'Is Not Empty', operator: 'isNotEmpty', requiresValue: false },
  ],
  number: [
    { label: 'Equals...', operator: '=', requiresValue: true },
    { label: 'Does Not Equal...', operator: '!=', requiresValue: true },
    { label: 'Greater Than...', operator: '>', requiresValue: true },
    { label: 'Greater Than Or Equal...', operator: '>=', requiresValue: true },
    { label: 'Less Than...', operator: '<', requiresValue: true },
    { label: 'Less Than Or Equal...', operator: '<=', requiresValue: true },
  ],
  date: [
    { label: 'Equals...', operator: 'equals', requiresValue: true },
    { label: 'Before...', operator: 'before', requiresValue: true },
    { label: 'After...', operator: 'after', requiresValue: true },
  ],
}

interface ExcelFilterConditionMenuProps {
  anchorEl: HTMLElement | null
  kind: BacklogFilterKind
  onClose: () => void
  onSelect: (condition: FilterCondition) => void
}

export function ExcelFilterConditionMenu({
  anchorEl,
  kind,
  onClose,
  onSelect,
}: ExcelFilterConditionMenuProps) {
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
          key={condition.label}
          onClick={() => {
            onSelect(condition)
            onClose()
          }}
        >
          {condition.label}
        </MenuItem>
      ))}
    </Menu>
  )
}
