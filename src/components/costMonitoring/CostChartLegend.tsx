import { Stack, Tooltip, Typography } from '@mui/material'
import type { KeyboardEvent } from 'react'
import { COST_SERIES } from './costChartConfig'
import { CostLineSwatch } from './CostLineSwatch'
import { useI18n } from '../../i18n/useI18n'

interface CostChartLegendProps {
  /** tháng chưa có PL simulation nào → mục PL TGT hiện mờ + tooltip giải thích */
  plUnavailable?: boolean
  /** đường Estimate (MTD) đang hiện trên 9 chart */
  estVisible?: boolean
  /** có → bấm mục Estimate (MTD) để bật/tắt đường */
  onToggleEst?: () => void
}

// Legend chung cho cả 9 chart – hiển thị 1 lần ở header, thứ tự như Excel
export function CostChartLegend({ plUnavailable = false, estVisible = true, onToggleEst }: CostChartLegendProps) {
  const { t } = useI18n()

  return (
    <Stack
      direction="row"
      sx={{ flexWrap: 'wrap', alignItems: 'center', columnGap: 2, rowGap: 0.5, pl: 1 }}
    >
      {COST_SERIES.map((series) => {
        const dimmed = plUnavailable && series.key === 'plTgt'
        const toggleable = series.key === 'estMtd' && Boolean(onToggleEst)
        const hidden = series.key === 'estMtd' && !estVisible

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
              {...(toggleable && {
                role: 'button',
                tabIndex: 0,
                'aria-pressed': !hidden,
                onClick: onToggleEst,
                onKeyDown: (event: KeyboardEvent) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onToggleEst?.()
                  }
                },
              })}
              sx={{
                alignItems: 'center',
                gap: 0.75,
                cursor: toggleable ? 'pointer' : 'help',
                opacity: dimmed || hidden ? 0.4 : 1,
                userSelect: 'none',
              }}
            >
              <CostLineSwatch series={series.key} />

              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  textDecoration: dimmed || hidden ? 'line-through' : 'none',
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
