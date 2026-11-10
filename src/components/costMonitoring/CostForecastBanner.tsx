import { Alert, Chip, Stack, Typography } from '@mui/material'
import type { CostChart, CostDetailTarget } from '../../types/costMonitoring'
import { COST_ROWS } from './costChartConfig'
import { buildRows, getEstimateOver } from './costChartUtils'
import { useI18n } from '../../i18n/useI18n'

interface CostForecastBannerProps {
  // "2026-10" – để xác định ngày cuối tháng
  month: string | null
  charts: CostChart[]
  onOpenDetail?: (target: CostDetailTarget) => void
}

function frameLabel(chart: CostChart) {
  return `${COST_ROWS.find((r) => r.div === chart.div)?.label ?? chart.div} · ${chart.chart}`
}

// Banner "N khung đã vượt / dự báo vượt"
//   đã vượt   : forecast.status = OVER của BE
//   dự báo vượt: chưa OVER và estMtd ngày cuối tháng > fluctTgt ngày cuối tháng
export function CostForecastBanner({ month, charts, onOpenDetail }: CostForecastBannerProps) {
  const { t } = useI18n()

  const over = charts.filter((c) => c.forecast?.status === 'OVER')
  const willExceed = charts.filter(
    (c) => c.forecast?.status !== 'OVER' && getEstimateOver(buildRows(month, c))?.isOver,
  )

  const groups = [
    { key: 'over', severity: 'error' as const, items: over, text: t.cost.banner.over },
    { key: 'willExceed', severity: 'warning' as const, items: willExceed, text: t.cost.banner.willExceed },
  ].filter((g) => g.items.length > 0)

  if (groups.length === 0) return null

  return (
    <Stack sx={{ gap: 0.5, flexShrink: 0 }}>
      {groups.map((g) => (
        <Alert key={g.key} severity={g.severity} sx={{ py: 0, alignItems: 'center' }}>
          <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{g.text(g.items.length)}</Typography>

            {g.items.map((c) => (
              <Chip
                key={`${c.div}-${c.chart}`}
                size="small"
                variant="outlined"
                color={g.severity}
                label={frameLabel(c)}
                onClick={onOpenDetail && (() => onOpenDetail({ div: c.div, chart: c.chart }))}
                sx={{ height: 22, fontSize: 12 }}
              />
            ))}
          </Stack>
        </Alert>
      ))}
    </Stack>
  )
}
