import { Box, Skeleton, Typography, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { CostChart } from '../../types/costMonitoring'
import { CostChartOverlay } from './CostChartOverlay'
import { CostChartStats } from './CostChartStats'
import { COST_SERIES, TABULAR_NUMS, formatK, seriesColor } from './costChartConfig'
import { buildRows, buildXTicks, buildYAxis } from './costChartUtils'
import { useI18n } from '../../i18n/useI18n'

interface CostChartCardProps {
  // "2026-10" – dùng để dựng đủ ngày trong tháng cho trục X
  month: string | null
  chart: CostChart | undefined
  title: string
  loading: boolean
}

function EmptyState({ text }: { text: string }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center' }}>
      <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
        {text}
      </Typography>
    </Box>
  )
}

export function CostChartCard({ month, chart, title, loading }: CostChartCardProps) {
  const { t } = useI18n()

  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const rows = chart ? buildRows(month, chart) : []
  const visibleSeries = COST_SERIES.filter((s) => rows.some((r) => r[s.key] != null))

  const renderTooltip = ({ active, label }: TooltipContentProps) => {
    const row = active ? rows.find((r) => r.label === label) : undefined

    if (!row) return null

    return (
      <Box
        sx={{
          px: 1,
          py: 0.75,
          borderRadius: 1.5,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[3],
          fontSize: 11.5,
        }}
      >
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, mb: 0.25 }}>
          {dayjs(row.date).format('D-MMM-YYYY')}
        </Typography>

        {visibleSeries.map((s) => (
          <Box key={s.key} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box component="span" sx={{ color: seriesColor(s, dark), fontWeight: 600 }}>
              {s.label}
            </Box>
            <Box component="span" sx={TABULAR_NUMS}>
              {row[s.key] == null ? '–' : `${formatK(row[s.key])} K$`}
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  let body
  if (!chart && loading) {
    body = <Skeleton variant="rounded" sx={{ flex: 1, minHeight: 0 }} />
  } else if (!chart || visibleSeries.length === 0) {
    body = <EmptyState text={t.cost.chartEmpty} />
  } else {
    const yAxis = buildYAxis(rows, chart)
    const axisTick = { fontSize: 11, fill: theme.palette.text.secondary, style: TABULAR_NUMS }

    body = (
      <>
        <CostChartStats rows={rows} chart={chart} />

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            {/* right margin chừa chỗ cho tag giá trị FC / PL / Fluct ở mép phải */}
            <LineChart data={rows} margin={{ top: 8, right: 44, bottom: 0, left: 0 }}>
              <CartesianGrid
                vertical={false}
                stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
              />

              <XAxis
                dataKey="label"
                ticks={buildXTicks(rows)}
                interval={0}
                height={22}
                // padding phải để nhãn ngày cuối tháng không bị cắt
                padding={{ left: 4, right: 12 }}
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: theme.palette.divider }}
              />

              <YAxis
                width={40}
                domain={[0, yAxis.max]}
                ticks={yAxis.ticks}
                allowDataOverflow
                tickFormatter={(v: number) => v.toFixed(1)}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                content={renderTooltip}
                isAnimationActive={false}
                cursor={{ stroke: theme.palette.text.disabled, strokeDasharray: '3 3' }}
              />

              {visibleSeries.map((s) => (
                <Line
                  key={s.key}
                  type="linear"
                  // estimate vẽ bằng estLine để nối tiếp từ điểm actual cuối
                  dataKey={s.key === 'estMtd' ? 'estLine' : s.key}
                  name={s.label}
                  stroke={seriesColor(s, dark)}
                  strokeWidth={s.strokeWidth}
                  strokeDasharray={s.dash}
                  connectNulls={false}
                  dot={false}
                  activeDot={{ r: 3 }}
                  isAnimationActive={false}
                />
              ))}

              <CostChartOverlay rows={rows} chart={chart} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </>
    )
  }

  return (
    <Box
      sx={{
        p: 0.75,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        // md+: cao theo ô lưới (giãn vừa trang) – dải chip ~28px, phần còn lại cho chart
        height: { xs: 325, md: '100%' },
        // nền do ô lưới quyết định (MOLD có tint xen kẽ)
        bgcolor: 'transparent',
        opacity: chart && loading ? 0.6 : 1,
        transition: 'opacity 120ms',
      }}
    >
      {/* Màn nhỏ không có nhãn hàng/cột → ghi rõ "PRESS · OT" */}
      <Typography
        sx={{
          display: { xs: 'block', md: 'none' },
          fontSize: 12.5,
          fontWeight: 800,
          mb: 0.5,
        }}
      >
        {title}
      </Typography>

      {body}
    </Box>
  )
}
