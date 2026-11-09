import { Box, Stack, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { AiLogDayStat } from '../../types/assistantLogs'
import { useI18n } from '../../i18n/useI18n'
import { TABULAR_NUMS, formatSec } from './aiLogsUtils'

interface AiLogsDailyChartProps {
  // BE đã điền đủ mọi ngày trong [from, to]
  rows: AiLogDayStat[]
  height?: number
}

interface ChartRow extends AiLogDayStat {
  label: string
  avgSec: number | null
}

// Cột = số câu hỏi (trục trái), line = thời gian TB theo giây (trục phải)
export function AiLogsDailyChart({ rows, height = 220 }: AiLogsDailyChartProps) {
  const { t } = useI18n()
  const labels = t.aiLogs.chart
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const barColor = dark ? '#93C5FD' : '#9DC3E6'
  const lineColor = dark ? '#FBBF24' : '#D97706'

  const data: ChartRow[] = rows.map((r) => ({
    ...r,
    label: dayjs(r.date).format('DD/MM'),
    avgSec: r.avgMs == null ? null : r.avgMs / 1000,
  }))

  const axisTick = { fontSize: 11, fill: theme.palette.text.secondary, style: TABULAR_NUMS }

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const row = active ? (payload?.[0]?.payload as ChartRow | undefined) : undefined
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
          {dayjs(row.date).format('ddd DD/MM/YYYY')}
        </Typography>

        {[
          { label: labels.count, value: String(row.count), color: barColor },
          { label: labels.avg, value: formatSec(row.avgMs), color: lineColor },
          ...(row.errorCount ? [{ label: labels.errors, value: String(row.errorCount), color: theme.palette.error.main }] : []),
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box component="span" sx={{ color: item.color, fontWeight: 600 }}>{item.label}</Box>
            <Box component="span" sx={TABULAR_NUMS}>{item.value}</Box>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        px: 1.5,
        pt: 1,
        pb: 0.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        flexShrink: 0,
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.25, mb: 0.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800, mr: 1 }}>{labels.title}</Typography>

        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: barColor }} />
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {`${labels.count} (${labels.leftAxis})`}
          </Typography>
        </Stack>

        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
          <Box component="svg" width={14} height={8}>
            <line x1={0} y1={4} x2={14} y2={4} stroke={lineColor} strokeWidth={2} />
          </Box>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {`${labels.avg} (${labels.rightAxis})`}
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ height, position: 'relative' }}>
        {data.length === 0 ? (
          <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{labels.empty}</Typography>
          </Box>
        ) : (
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

              <YAxis
                yAxisId="count"
                orientation="left"
                width={40}
                allowDecimals={false}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                yAxisId="avg"
                orientation="right"
                width={40}
                domain={[0, 'auto']}
                tickFormatter={(v: number) => `${v.toFixed(0)}s`}
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
                yAxisId="count"
                dataKey="count"
                fill={barColor}
                maxBarSize={28}
                isAnimationActive={false}
              />

              <Line
                yAxisId="avg"
                type="monotone"
                dataKey="avgSec"
                stroke={lineColor}
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  )
}
