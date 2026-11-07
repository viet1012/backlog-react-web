import { Box, Stack, Tooltip, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { CostChart } from '../../types/costMonitoring'
import {
  COST_SERIES,
  PACE_AHEAD_BADGE,
  PACE_AHEAD_BADGE_DARK_FG,
  STATUS_BADGE,
  STATUS_BADGE_DARK_FG,
  TABULAR_NUMS,
  formatK,
  seriesColor,
  type CostSeriesKey,
} from './costChartConfig'
import { getCostPace, getCostStatus, lastValue, type CostChartRow } from './costChartUtils'
import { useI18n } from '../../i18n/useI18n'

interface CostChartStatsProps {
  rows: CostChartRow[]
  chart: CostChart
  // số chữ số thập phân của % trên badge (chart minh họa trong hướng dẫn dùng 1)
  ratioDigits?: number
}

// Dải số liệu phía trên vùng vẽ: chip FC / PL / Act / Est / Fluct + badge trạng thái
export function CostChartStats({ rows, chart, ratioDigits = 0 }: CostChartStatsProps) {
  const { t } = useI18n()

  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const chips: { key: CostSeriesKey; label: string; value: number | null }[] = [
    { key: 'fcTgt', label: 'FC', value: chart.fcTgt },
    { key: 'plTgt', label: 'PL', value: chart.plTgt },
    { key: 'actMtd', label: 'Act', value: chart.actMtdLatest },
    { key: 'estMtd', label: 'Est', value: chart.estMonthEnd },
    { key: 'fluctTgt', label: 'Fluct', value: lastValue(rows, 'fluctTgt') },
  ]

  const status = getCostStatus(chart, rows)

  let badge = null

  if (status) {
    // OK nhưng % đã dùng > tiến độ chuẩn + PACE_TOLERANCE → vàng cam thay vì xanh
    const pace = status.level === 'ok' ? getCostPace(chart, rows) : null
    const palette = pace?.ahead
      ? { fg: dark ? PACE_AHEAD_BADGE_DARK_FG : PACE_AHEAD_BADGE.fg, bg: PACE_AHEAD_BADGE.bg }
      : { fg: dark ? STATUS_BADGE_DARK_FG[status.level] : STATUS_BADGE[status.level].fg, bg: STATUS_BADGE[status.level].bg }

    // pill: nền nhạt + viền + chữ màu; nền tối dùng alpha của màu chữ
    const fg = palette.fg
    const bg = dark ? alpha(fg, 0.14) : palette.bg

    const title = status.level === 'noActual'
      ? t.costGuide.hints.noActual
      : pace
        ? t.costGuide.hints.pace(Math.round(pace.usedPct), Math.round(pace.elapsedPct))
        : t.costGuide.hints.badge

    badge = (
      <Tooltip
        title={title}
        arrow
        enterTouchDelay={0}
      >
        <Box
          sx={{
            ...TABULAR_NUMS,
            flexShrink: 0,
            px: 0.75,
            py: 0.125,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            cursor: 'help',
            color: fg,
            bgcolor: bg,
            border: `1px solid ${alpha(fg, 0.3)}`,
          }}
        >
          {status.level === 'noActual'
            ? t.cost.noActual
            : `${t.cost.status[status.level]} ${status.ratio.toFixed(ratioDigits)}%`}
        </Box>
      </Tooltip>
    )
  }

  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', gap: 1, minHeight: 24, mb: 0.5, flexShrink: 0 }}
    >
      <Stack
        direction="row"
        sx={{ flex: 1, minWidth: 0, flexWrap: 'wrap', alignItems: 'center', columnGap: 1.25, rowGap: 0.25 }}
      >
        {chips.filter((c) => c.value != null).map((c) => {
          const series = COST_SERIES.find((s) => s.key === c.key)!
          const color = seriesColor(series, dark)

          return (
            <Tooltip key={c.key} title={t.costGuide.hints.series[c.key]} arrow enterTouchDelay={0}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                {series.dash ? (
                  <Box component="svg" width={12} height={8} sx={{ flexShrink: 0 }}>
                    <line x1={0} y1={4} x2={12} y2={4} stroke={color} strokeWidth={2} strokeDasharray="3 2" />
                  </Box>
                ) : (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                )}

                <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {c.label}{' '}
                  <Box component="span" sx={{ ...TABULAR_NUMS, color: 'text.primary', fontWeight: 700 }}>
                    {formatK(c.value)}
                  </Box>
                </Typography>
              </Stack>
            </Tooltip>
          )
        })}
      </Stack>

      {badge}
    </Stack>
  )
}
