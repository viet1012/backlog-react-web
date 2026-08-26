import { Menu, MenuItem } from '@mui/material'
import type { BacklogFilterKind } from '../../config/backlogFilterFields'

export interface FilterCondition {
  label: string
  operator: string
  between?: boolean
}

const conditions: Record<BacklogFilterKind, FilterCondition[]> = {
  text: [
    { label: 'Equals...', operator: 'equals' },
    { label: 'Does Not Equal...', operator: 'doesNotEqual' },
    { label: 'Begins With...', operator: 'startsWith' },
    { label: 'Ends With...', operator: 'endsWith' },
    { label: 'Contains...', operator: 'contains' },
    { label: 'Does Not Contain...', operator: 'doesNotContain' },
    { label: 'Custom Filter...', operator: 'contains' },
  ],
  number: [
    { label: 'Equals...', operator: '=' },
    { label: 'Does Not Equal...', operator: '!=' },
    { label: 'Greater Than...', operator: '>' },
    { label: 'Greater Than Or Equal...', operator: '>=' },
    { label: 'Less Than...', operator: '<' },
    { label: 'Less Than Or Equal...', operator: '<=' },
    { label: 'Between...', operator: 'between', between: true },
    { label: 'Custom Filter...', operator: '=' },
  ],
  date: [
    { label: 'Equals...', operator: 'equals' },
    { label: 'Before...', operator: 'before' },
    { label: 'After...', operator: 'after' },
    { label: 'Between...', operator: 'between', between: true },
    { label: 'Custom Filter...', operator: 'equals' },
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
