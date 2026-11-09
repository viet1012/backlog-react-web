import { Alert, Chip, Stack, Typography } from '@mui/material'
import type { CostChart, CostDetailTarget, CostForecastStatus } from '../../types/costMonitoring'
import { COST_ROWS } from './costChartConfig'
import { useI18n } from '../../i18n/useI18n'

interface CostForecastBannerProps {
  charts: CostChart[]
  onOpenDetail?: (target: CostDetailTarget) => void
}

function frameLabel(chart: CostChart) {
  return `${COST_ROWS.find((r) => r.div === chart.div)?.label ?? chart.div} · ${chart.chart}`
}

// Banner "N khung đã vượt / dự báo vượt" – đếm theo forecast.status của BE (cùng nguồn với greeting mascot)
export function CostForecastBanner({ charts, onOpenDetail }: CostForecastBannerProps) {
  const { t } = useI18n()

  const byStatus = (status: CostForecastStatus) => charts.filter((c) => c.forecast?.status === status)

  const groups = [
    { key: 'over', severity: 'error' as const, items: byStatus('OVER'), text: t.cost.banner.over },
    { key: 'willExceed', severity: 'warning' as const, items: byStatus('WILL_EXCEED'), text: t.cost.banner.willExceed },
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
