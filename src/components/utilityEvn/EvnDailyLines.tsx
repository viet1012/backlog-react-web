import { Typography, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { useI18n } from '../../i18n/useI18n'
import {
  evnPctTone,
  formatAmount,
  formatAmountDiff,
  formatDayMonth,
  formatPct,
  toUnit,
  type EvnCompareRow,
  type EvnGroupKey,
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { EvnChartBox, EvnTooltipBox } from './EvnChartParts'
import { EVN_PARTIAL_COLOR, evnAxisTick, evnGridStroke, evnSeriesColors, evnToneColor } from './evnCompareUi'

interface EvnDailyLinesProps {
  rows: EvnCompareRow[]
  unit: EvnUnit
  // nhóm khung giờ cần vẽ (tổng điện lưới / bình thường / cao điểm / thấp điểm / solar)
  group: EvnGroupKey
  height: number
  loading: boolean
}

interface Point {
  date: string
  label: string
  excel: number | null
  actual: number | null
  partial: boolean
  row: EvnCompareRow
}

interface DotRenderProps {
  cx?: number
  cy?: number
  index?: number
  payload?: Point
}

// 2 đường Excel / Thực tế theo ngày của 1 nhóm khung giờ, 1 trục y
export function EvnDailyLines({ rows, unit, group, height, loading }: EvnDailyLinesProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const theme = useTheme()
  const colors = evnSeriesColors(theme)
  const axisTick = evnAxisTick(theme)

  const data: Point[] = rows.map((row) => {
    const cell = row.cells[group]
    return {
      date: row.date,
      label: formatDayMonth(row.date),
      excel: row.hasExcel && !cell.notApplicable ? toUnit(cell.excel, unit) : null,
      actual: cell.notApplicable ? null : toUnit(cell.actual, unit),
      partial: row.partial,
      row,
    }
  })

  const empty = data.every((p) => p.excel === null && p.actual === null)

  // chỉ đánh dấu ngày partial (chấm cam), ngày thường không vẽ chấm
  const renderActualDot = (props: unknown) => {
    const { cx, cy, index, payload } = props as DotRenderProps
    const key = `dot-${index ?? 0}`
    if (cx == null || cy == null || !payload?.partial) return <g key={key} />
    return (
      <circle key={key} cx={cx} cy={cy} r={4} fill={EVN_PARTIAL_COLOR} stroke={theme.palette.background.paper} strokeWidth={1.5} />
    )
  }

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined
    if (!point) return null
    const cell = point.row.cells[group]

    if (cell.notApplicable) {
      return (
        <EvnTooltipBox
          title={`${dayjs(point.date).format('ddd DD/MM/YYYY')} · ${labels.table.groups[group]}`}
          items={[]}
          footer={<Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{labels.table.sundayPeak}</Typography>}
        />
      )
    }

    const tone = evnPctTone(cell.pct)

    return (
      <EvnTooltipBox
        title={`${dayjs(point.date).format('ddd DD/MM/YYYY')} · ${labels.table.groups[group]}`}
        items={[
          {
            label: labels.chart.excel,
            value: point.row.hasExcel ? `${formatAmount(cell.excel, unit)} ${unit}` : labels.chart.noExcel,
            color: colors.excel,
          },
          { label: labels.chart.actual, value: `${formatAmount(cell.actual, unit)} ${unit}`, color: colors.actual },
          { label: labels.table.diff, value: `${formatAmountDiff(cell.diff, unit)}${cell.diff === null ? '' : ` ${unit}`}` },
          {
            label: labels.kpi.pct,
            value: formatPct(cell.pct, 2),
            valueColor: tone ? evnToneColor(theme, tone) : undefined,
          },
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
    <EvnChartBox height={height} loading={loading} empty={empty} emptyLabel={labels.chart.empty}>
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
            width={unit === 'kWh' ? 60 : 46}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => v.toLocaleString('en-US', { maximumFractionDigits: unit === 'kWh' ? 0 : 1 })}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={renderTooltip} isAnimationActive={false} cursor={{ stroke: theme.palette.divider }} />
          <Line
            type="linear"
            dataKey="excel"
            stroke={colors.excel}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="actual"
            stroke={colors.actual}
            strokeWidth={2}
            dot={renderActualDot}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </EvnChartBox>
  )
}
