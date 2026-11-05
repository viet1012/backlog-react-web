import { Stack, Tooltip, Typography } from '@mui/material'
import { COST_SERIES } from './costChartConfig'
import { CostLineSwatch } from './CostLineSwatch'
import { useI18n } from '../../i18n/useI18n'

// Legend chung cho cả 9 chart – hiển thị 1 lần ở header, thứ tự như Excel
export function CostChartLegend() {
  const { t } = useI18n()

  return (
    <Stack
      direction="row"
      sx={{ flexWrap: 'wrap', alignItems: 'center', columnGap: 2, rowGap: 0.5, pl: 1 }}
    >
      {COST_SERIES.map((series) => (
        // enterTouchDelay=0 → tap trên mobile hiện tooltip ngay
        <Tooltip key={series.key} title={t.costGuide.hints.series[series.key]} arrow enterTouchDelay={0}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, cursor: 'help' }}>
            <CostLineSwatch series={series.key} />

            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {series.label}
            </Typography>
          </Stack>
        </Tooltip>
      ))}
    </Stack>
  )
}
