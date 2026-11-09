import { Box, Stack, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { CostDetailDailyRow } from '../../types/costMonitoring'
import { TABULAR_NUMS, seriesColorOf } from './costChartConfig'
import { formatNum } from './costDetailUtils'
import { useI18n } from '../../i18n/useI18n'

interface CostDetailDailyChartProps {
  rows: CostDetailDailyRow[]
  fcTgt: number | null
  fluctTgt: number | null
  abnormalDays: Set<string>
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
}

const ABNORMAL_COLOR = '#F59E0B'

// Cột = chi trong ngày (trục phải), line = lũy kế (trục trái) + 2 đường ngang FC / Fluct
export function CostDetailDailyChart({
  rows,
  fcTgt,
  fluctTgt,
  abnormalDays,
  selectedDate,
  onSelectDate,
}: CostDetailDailyChartProps) {
  const { t } = useI18n()
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const barColor = dark ? '#93C5FD' : '#9DC3E6'
  const lineColor = seriesColorOf('actMtd', dark)
  const fcColor = seriesColorOf('fcTgt', dark)
  const fluctColor = seriesColorOf('fluctTgt', dark)

  const data = rows.map((r) => ({ ...r, label: dayjs(r.date).format('D') }))

  // trục phải (lũy kế) phải đủ cao để thấy cả FC / Fluct
  const cumMax = Math.max(
    0,
    fcTgt ?? 0,
    fluctTgt ?? 0,
    ...rows.map((r) => r.cumulative ?? 0),
  ) * 1.08 || 1

  // trục trái (chi trong ngày): có ngày âm (trả hàng) thì mở xuống dưới 0
  const dayMin = Math.min(0, ...rows.map((r) => r.daily ?? 0))

  const axisTick = { fontSize: 11, fill: theme.palette.text.secondary, style: TABULAR_NUMS }

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const row = active ? (payload?.[0]?.payload as CostDetailDailyRow | undefined) : undefined
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

        {[
          { label: t.costDetail.chart.daily, value: row.daily, color: barColor },
          { label: t.costDetail.chart.cumulative, value: row.cumulative, color: lineColor },
          { label: t.costDetail.daily.fluct, value: row.fluct, color: fluctColor },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box component="span" sx={{ color: item.color, fontWeight: 600 }}>{item.label}</Box>
            <Box component="span" sx={TABULAR_NUMS}>{`${formatNum(item.value)} K$`}</Box>
          </Box>
        ))}

        {abnormalDays.has(row.date) && (
          <Typography sx={{ fontSize: 11, mt: 0.25, color: ABNORMAL_COLOR, fontWeight: 700 }}>
            ⚠ {t.costDetail.daily.abnormal}
          </Typography>
        )}
      </Box>
    )
  }

  const legend = [
    { label: `${t.costDetail.chart.daily} (${t.costDetail.chart.leftAxis})`, color: barColor, kind: 'bar' as const },
    { label: `${t.costDetail.chart.cumulative} (${t.costDetail.chart.rightAxis})`, color: lineColor, kind: 'line' as const },
    ...(fcTgt != null ? [{ label: t.costDetail.chart.fc, color: fcColor, kind: 'dash' as const }] : []),
    ...(fluctTgt != null ? [{ label: t.costDetail.chart.fluct, color: fluctColor, kind: 'dash' as const }] : []),
  ]

  return (
    <Box>
      <Stack direction="row" sx={{ flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.25, mb: 0.5 }}>
        {legend.map((item) => (
          <Stack key={item.label} direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
            {item.kind === 'bar' ? (
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: item.color }} />
            ) : (
              <Box component="svg" width={14} height={8}>
                <line
                  x1={0}
                  y1={4}
                  x2={14}
                  y2={4}
                  stroke={item.color}
                  strokeWidth={2}
                  strokeDasharray={item.kind === 'dash' ? '4 2' : undefined}
                />
              </Box>
            )}
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{item.label}</Typography>
          </Stack>
        ))}
      </Stack>

      <Box sx={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />

            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              height={22}
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: theme.palette.divider }}
            />

            {/* Trục trái: chi trong ngày (cột) */}
            <YAxis
              yAxisId="day"
              orientation="left"
              width={44}
              domain={[dayMin, 'auto']}
              tickFormatter={(v: number) => v.toFixed(1)}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
            />

            {/* Trục phải: lũy kế (line) + FC / Fluct (đường ngang) – cùng thang để so trực tiếp */}
            <YAxis
              yAxisId="cum"
              orientation="right"
              width={44}
              domain={[0, cumMax]}
              tickFormatter={(v: number) => v.toFixed(0)}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              content={renderTooltip}
              isAnimationActive={false}
              cursor={{ fill: alpha(theme.palette.text.primary, 0.05) }}
            />

            <Bar
              yAxisId="day"
              dataKey="daily"
              maxBarSize={18}
              isAnimationActive={false}
              cursor="pointer"
              onClick={(entry) => {
                const date = (entry.payload as CostDetailDailyRow | undefined)?.date ?? null
                onSelectDate(date === selectedDate ? null : date)
              }}
            >
              {data.map((r) => (
                <Cell
                  key={r.date}
                  fill={abnormalDays.has(r.date) ? ABNORMAL_COLOR : barColor}
                  fillOpacity={selectedDate && selectedDate !== r.date ? 0.35 : 1}
                  stroke={selectedDate === r.date ? theme.palette.text.primary : undefined}
                />
              ))}
            </Bar>

            <Line
              yAxisId="cum"
              type="linear"
              dataKey="cumulative"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />

            {fcTgt != null && (
              <ReferenceLine yAxisId="cum" y={fcTgt} stroke={fcColor} strokeDasharray="8 4" strokeWidth={1.5} />
            )}

            {fluctTgt != null && (
              <ReferenceLine yAxisId="cum" y={fluctTgt} stroke={fluctColor} strokeDasharray="4 3" strokeWidth={1.5} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}
