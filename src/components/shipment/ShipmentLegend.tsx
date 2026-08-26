import { Box, Stack, Typography } from '@mui/material'
import { uiTokens } from '../../theme/uiTokens'

const legendTextSx = {
  fontFamily: 'monospace',
  fontSize: uiTokens.kpi.secondaryFontSize,
  color: 'text.secondary',
}

export function ShipmentLegend() {
  return (
    <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
      <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
        <Typography sx={legendTextSx}>0%</Typography>
        <Box
          sx={{
            width: 130,
            height: 8,
            borderRadius: 0.5,
            background:
              'linear-gradient(90deg, #d94b42 0%, #dc9939 45%, #59b979 100%)',
          }}
        />
        <Typography sx={legendTextSx}>100%</Typography>
      </Stack>

      <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
        <Typography sx={legendTextSx}>{'\u25a7'}</Typography>
        <Typography sx={legendTextSx}>
          hatched = no shipment that day
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={0.6}
        sx={{ alignItems: 'center', opacity: 0.55 }}
      >
        <Box sx={{ width: 7, height: 7, bgcolor: 'text.secondary' }} />
        <Typography sx={legendTextSx}>
          Stock row = warehouse stock (no ShipBy)
        </Typography>
      </Stack>
    </Stack>
  )
}
