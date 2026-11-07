import { Stack, Tooltip, Typography } from '@mui/material'
import { COST_SERIES } from './costChartConfig'
import { CostLineSwatch } from './CostLineSwatch'
import { useI18n } from '../../i18n/useI18n'

interface CostChartLegendProps {
  /** tháng chưa có PL simulation nào → mục PL TGT hiện mờ + tooltip giải thích */
  plUnavailable?: boolean
}

// Legend chung cho cả 9 chart – hiển thị 1 lần ở header, thứ tự như Excel
export function CostChartLegend({ plUnavailable = false }: CostChartLegendProps) {
  const { t } = useI18n()

  return (
    <Stack
      direction="row"
      sx={{ flexWrap: 'wrap', alignItems: 'center', columnGap: 2, rowGap: 0.5, pl: 1 }}
    >
      {COST_SERIES.map((series) => {
        const dimmed = plUnavailable && series.key === 'plTgt'

        return (
          // enterTouchDelay=0 → tap trên mobile hiện tooltip ngay
          <Tooltip
            key={series.key}
            title={dimmed ? t.cost.noPlSimulation : t.costGuide.hints.series[series.key]}
            arrow
            enterTouchDelay={0}
          >
            <Stack
              direction="row"
              sx={{ alignItems: 'center', gap: 0.75, cursor: 'help', opacity: dimmed ? 0.4 : 1 }}
            >
              <CostLineSwatch series={series.key} />

              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  textDecoration: dimmed ? 'line-through' : 'none',
                }}
              >
                {series.label}
              </Typography>
            </Stack>
          </Tooltip>
        )
      })}
    </Stack>
  )
}
