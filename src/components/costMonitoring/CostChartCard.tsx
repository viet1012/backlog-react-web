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
import { FactoryNoRowsOverlay } from '../common/FactoryNoRowsOverlay'

interface CostChartCardProps {
  // "2026-10" – dùng để dựng đủ ngày trong tháng cho trục X
  month: string | null
  chart: CostChart | undefined
  title: string
  loading: boolean
  // false → ẩn đường Estimate (MTD) (tắt từ legend)
  estVisible?: boolean
  // có → bấm ô mở drawer chi tiết
  onOpenDetail?: () => void
}

// Bản compact (chỉ bảng LED) vì 9 ô chart có thể cùng trống
function EmptyState({ text }: { text: string }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center' }}>
      <FactoryNoRowsOverlay variant="compact" title={text} minHeight={0} />
    </Box>
  )
}

export function CostChartCard({ month, chart, title, loading, estVisible = true, onOpenDetail }: CostChartCardProps) {
  const { t } = useI18n()

  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const rows = chart ? buildRows(month, chart) : []
  const dataSeries = COST_SERIES.filter((s) => rows.some((r) => r[s.key] != null))
  const visibleSeries = estVisible ? dataSeries : dataSeries.filter((s) => s.key !== 'estMtd')

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
  } else if (!chart || dataSeries.length === 0) {
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
                  // estMtd vẽ thẳng từ API: null giữ null (đứt đoạn), không nối
                  dataKey={s.key}
                  name={s.label}
                  stroke={seriesColor(s, dark)}
                  strokeWidth={s.strokeWidth}
                  strokeDasharray={s.dash}
                  connectNulls={false}
                  dot={false}
                  activeDot={s.key === 'estMtd' ? false : { r: 3 }}
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

  // chỉ mở được khi đã có khung từ API (OT chưa actual vẫn mở để xem KPI)
  const clickable = Boolean(chart && onOpenDetail)

  return (
    <Box
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      title={clickable ? t.cost.openDetail : undefined}
      aria-label={clickable ? `${title} – ${t.cost.openDetail}` : undefined}
      onClick={clickable ? onOpenDetail : undefined}
      onKeyDown={clickable
        ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onOpenDetail?.()
          }
        }
        : undefined}
      sx={{
        p: 0.75,
        ...(clickable && {
          cursor: 'pointer',
          borderRadius: 1,
          '&:hover': { bgcolor: 'action.hover' },
          '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
        }),
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        // md+: cao theo ô lưới (giãn vừa trang) – dải chip ~28px, phần còn lại cho chart
        height: { xs: 325, md: '100%' },
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
