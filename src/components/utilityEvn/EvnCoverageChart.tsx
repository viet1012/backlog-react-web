import { Typography, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import { ResponsiveContainer } from '../common/StableResponsiveContainer'

import type { TooltipContentProps } from 'recharts'
import { useI18n } from '../../i18n/useI18n'
import { formatDayMonth, type EvnCompareRow } from '../../utils/utilityEvnCompare'
import { EvnChartBox, EvnTooltipBox } from './EvnChartParts'
import { EVN_PARTIAL_COLOR, evnAxisTick, evnGridStroke, evnSeriesColors } from './evnCompareUi'

interface EvnCoverageChartProps {
  rows: EvnCompareRow[]
  minCoveragePct: number | null
  height: number
  loading: boolean
}

interface Point {
  date: string
  label: string
  coverage: number
  partial: boolean
  row: EvnCompareRow
}

interface DotRenderProps {
  cx?: number
  cy?: number
  index?: number
  payload?: Point
}

// Độ phủ đồng hồ theo ngày (đường + chấm) với vạch ngưỡng partial.
// Dùng đường (không dùng cột) vì trục y được cắt gần 100% để thấy rõ chênh lệch nhỏ.
export function EvnCoverageChart({ rows, minCoveragePct, height, loading }: EvnCoverageChartProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const theme = useTheme()
  const colors = evnSeriesColors(theme)
  const axisTick = evnAxisTick(theme)
  const threshold = minCoveragePct ?? null

  const data: Point[] = rows.flatMap((row) =>
    row.coveragePct === null
      ? []
      : [{ date: row.date, label: formatDayMonth(row.date), coverage: row.coveragePct, partial: row.partial, row }],
  )

  const renderDot = (props: unknown) => {
    const { cx, cy, index, payload } = props as DotRenderProps
    const key = `dot-${index ?? 0}`
    if (cx == null || cy == null || !payload) return <g key={key} />
    return payload.partial ? (
      <circle key={key} cx={cx} cy={cy} r={4.5} fill={EVN_PARTIAL_COLOR} stroke={theme.palette.background.paper} strokeWidth={1.5} />
    ) : (
      <circle key={key} cx={cx} cy={cy} r={2.5} fill={colors.actual} />
    )
  }

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined
    if (!point) return null
    const { row } = point

    return (
      <EvnTooltipBox
        title={dayjs(point.date).format('ddd DD/MM/YYYY')}
        items={[
          {
            label: labels.table.coverage,
            value: `${point.coverage.toFixed(1)}%`,
            color: point.partial ? EVN_PARTIAL_COLOR : colors.actual,
          },
          ...(row.hoursWithData === null
            ? []
            : [{ label: labels.table.hoursWithData, value: labels.table.hoursOfDay(Math.round(row.hoursWithData * 10) / 10) }]),
          ...(row.missingMeters.length > 0
            ? [{ label: labels.charts.missingMeters, value: String(row.missingMeters.length) }]
            : []),
        ]}
        footer={point.partial ? (
          <Typography sx={{ mt: 0.25, fontSize: 11, fontWeight: 700, color: EVN_PARTIAL_COLOR }}>
            {labels.chart.partial}
          </Typography>
        ) : undefined}
      />
    )
  }

  return (
    <EvnChartBox height={height} loading={loading} empty={data.length === 0} emptyLabel={labels.chart.empty}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={evnGridStroke(theme)} />
          <XAxis
            dataKey="label"
            interval="preserveStartEnd"
            minTickGap={16}
            height={22}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: theme.palette.divider }}
          />
          <YAxis
            width={44}
            // luôn thấy vạch ngưỡng và 100%
            domain={[
              (min: number) => Math.max(0, Math.floor(Math.min(min, (threshold ?? 100) - 4))),
              100,
            ]}
            allowDataOverflow
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={renderTooltip} isAnimationActive={false} cursor={{ stroke: theme.palette.divider }} />
          {threshold !== null && (
            <ReferenceLine
              y={threshold}
              stroke={theme.palette.text.secondary}
              strokeDasharray="4 3"
              label={{
                value: labels.charts.coverageThreshold(threshold),
                position: 'insideBottomRight',
                fontSize: 11,
                fill: theme.palette.text.secondary,
              }}
            />
          )}
          <Line
            type="linear"
            dataKey="coverage"
            stroke={colors.actual}
            strokeWidth={2}
            dot={renderDot}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </EvnChartBox>
  )
}
