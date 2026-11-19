import { Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import { ResponsiveContainer } from '../common/StableResponsiveContainer'

import type { TooltipContentProps } from 'recharts'
import { useI18n } from '../../i18n/useI18n'
import {
  EVN_PCT_OK,
  EVN_PCT_WARN,
  evnPctTone,
  formatAmount,
  formatDayMonth,
  formatPct,
  type EvnCompareRow,
  type EvnPctTone,
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { EvnChartBox, EvnTooltipBox } from './EvnChartParts'
import { EVN_PARTIAL_COLOR, evnAxisTick, evnGridStroke, evnSeriesColors, evnToneColor } from './evnCompareUi'

interface EvnPctChartProps {
  rows: EvnCompareRow[]
  unit: EvnUnit
  height: number
  loading: boolean
}

interface Point {
  date: string
  label: string
  pct: number
  tone: EvnPctTone | null
  partial: boolean
  row: EvnCompareRow
}

// Cột % lệch tổng điện lưới (ngày có Excel), tô màu theo ngưỡng; ngày partial nhạt + viền cam
export function EvnPctChart({ rows, unit, height, loading }: EvnPctChartProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const theme = useTheme()
  const colors = evnSeriesColors(theme)
  const axisTick = evnAxisTick(theme)
  const thresholdStroke = theme.palette.text.disabled

  const data: Point[] = rows.flatMap((row) => {
    const pct = row.cells.totalElectricity.pct
    if (!row.hasExcel || pct === null) return []
    return [{ date: row.date, label: formatDayMonth(row.date), pct, tone: evnPctTone(pct), partial: row.partial, row }]
  })

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined
    if (!point) return null
    const cell = point.row.cells.totalElectricity

    return (
      <EvnTooltipBox
        title={dayjs(point.date).format('ddd DD/MM/YYYY')}
        items={[
          { label: labels.chart.excel, value: `${formatAmount(cell.excel, unit)} ${unit}`, color: colors.excel },
          { label: labels.chart.actual, value: `${formatAmount(cell.actual, unit)} ${unit}`, color: colors.actual },
          { label: labels.kpi.pct, value: formatPct(point.pct, 2), valueColor: evnToneColor(theme, point.tone) },
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
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={evnGridStroke(theme)} />
          <XAxis
            dataKey="label"
            interval="preserveStartEnd"
            minTickGap={16}
            height={22}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={44}
            // luôn thấy ngưỡng −WARN và +OK; cột mọc từ 0
            domain={[
              (min: number) => Math.min(-EVN_PCT_WARN, Math.floor(min)),
              (max: number) => Math.max(EVN_PCT_OK, Math.ceil(max)),
            ]}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={renderTooltip} isAnimationActive={false} cursor={{ fill: alpha(theme.palette.text.primary, 0.05) }} />

          {[EVN_PCT_WARN, -EVN_PCT_WARN, EVN_PCT_OK, -EVN_PCT_OK].map((y) => (
            <ReferenceLine key={y} y={y} stroke={thresholdStroke} strokeDasharray="4 3" />
          ))}
          <ReferenceLine y={0} stroke={theme.palette.divider} />

          <Bar dataKey="pct" maxBarSize={16} isAnimationActive={false}>
            {data.map((point) => {
              const color = evnToneColor(theme, point.tone)
              return (
                <Cell
                  key={point.date}
                  fill={point.partial ? alpha(color, 0.35) : color}
                  stroke={point.partial ? EVN_PARTIAL_COLOR : undefined}
                  strokeWidth={point.partial ? 1.5 : 0}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </EvnChartBox>
  )
}
