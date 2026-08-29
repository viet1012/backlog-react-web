import { Box, Stack, TextField, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
import { GlassPanel } from '../common/GlassPanel'
import { uiTokens } from '../../theme/uiTokens'
import { ShipmentLegend } from './ShipmentLegend'
import { AppButton } from '../common/AppButton'

interface ShipmentFilterBarProps {
  fromD: string
  toD: string
  loading: boolean
  onFromDateChange: (value: string) => void
  onToDateChange: (value: string) => void
  onApply: () => void
  onReset: () => void
}

export function ShipmentFilterBar({
  fromD, toD, loading, onFromDateChange, onToDateChange, onApply, onReset,
}: ShipmentFilterBarProps) {
  const controlSx = { height: uiTokens.control.height, fontSize: uiTokens.control.fontSize }
  const dateFieldSx: SxProps<Theme> = (theme) => ({
    width: 145,
    '& .MuiInputBase-root': controlSx,
    '& input::-webkit-calendar-picker-indicator': {
      filter: theme.palette.mode === 'dark' ? 'invert(1) opacity(0.8)' : 'none',
    },
  })

  return (
    <GlassPanel sx={{ px: 1.5, py: 1 }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', overflowX: 'auto' }}>
        <Typography sx={{ fontSize: uiTokens.typography.inputLabel, fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
          DATE RANGE
        </Typography>
        <TextField label="From" type="date" size="small" value={fromD}
          onChange={(event) => onFromDateChange(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }} sx={dateFieldSx} />
        <Typography color="text.secondary" sx={{ fontSize: 12 }}>→</Typography>
        <TextField label="To" type="date" size="small" value={toD}
          onChange={(event) => onToDateChange(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }} sx={dateFieldSx} />
        <AppButton appearance="action" disabled={loading} onClick={onApply}>Apply</AppButton>
        <AppButton disabled={loading} onClick={onReset}>14 Days</AppButton>
        <Box sx={{ flex: 1 }} />
        <ShipmentLegend />
      </Stack>
    </GlassPanel>
  )
}
