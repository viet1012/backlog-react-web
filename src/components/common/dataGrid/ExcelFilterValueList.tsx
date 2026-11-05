import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
} from '@mui/material'

import { useI18n } from '../../../i18n/useI18n'

interface ExcelFilterValueListProps {
  values: string[]
  selected: ReadonlySet<string>
  allSelected: boolean
  someSelected: boolean
  onToggleAll: () => void
  onToggleValue: (value: string) => void
}

export function ExcelFilterValueList({
  values,
  selected,
  allSelected,
  someSelected,
  onToggleAll,
  onToggleValue,
}: ExcelFilterValueListProps) {
  const { t } = useI18n()
  const labelSx = {
    m: 0,
    width: '100%',
    minHeight: 27,
    '& .MuiFormControlLabel-label': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: 12.5,
    },
  } as const

  return (
    <Box sx={{ height: 245, overflowY: 'auto', px: 1, py: 0.5 }}>
      <FormControlLabel
        control={(
          <Checkbox
            size="small"
            checked={allSelected}
            indeterminate={someSelected}
            onChange={onToggleAll}
          />
        )}
        label={t.dataGrid.selectAll}
        sx={{
          ...labelSx,
          '& .MuiFormControlLabel-label': {
            ...labelSx['& .MuiFormControlLabel-label'],
            fontWeight: 700,
          },
        }}
      />

      {values.map((value) => (
        <FormControlLabel
          key={value || '__blank__'}
          control={(
            <Checkbox
              size="small"
              checked={selected.has(value)}
              onChange={() => onToggleValue(value)}
            />
          )}
          label={value === '' ? t.dataGrid.blanks : value}
          sx={labelSx}
        />
      ))}

      {values.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          {t.dataGrid.noValues}
        </Typography>
      )}
    </Box>
  )
}
