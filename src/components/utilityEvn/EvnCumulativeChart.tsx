import { useTheme } from '@mui/material'
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
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { EvnChartBox, EvnTooltipBox } from './EvnChartParts'
import { evnAxisTick, evnGridStroke, evnSeriesColors, evnToneColor } from './evnCompareUi'

interface EvnCumulativeChartProps {
  rows: EvnCompareRow[]
  unit: EvnUnit
  height: number
  loading: boolean
}

interface Point {
  date: string
  label: string
  // lũy kế, đơn vị BE (MWh / kUSD)
  excelRaw: number
  actualRaw: number
  // lũy kế, đơn vị đang chọn
  excel: number | null
  actual: number | null
  days: number
}

// Lũy kế Excel vs Thực tế (tổng điện lưới) trên các ngày có Excel – thấy độ lệch dồn theo kỳ
export function EvnCumulativeChart({ rows, unit, height, loading }: EvnCumulativeChartProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const theme = useTheme()
  const colors = evnSeriesColors(theme)
  const axisTick = evnAxisTick(theme)

  const data: Point[] = []
  let excelSum = 0
  let actualSum = 0

  // cùng tập ngày với dòng Tổng / KPI: có Excel và có đủ 2 số
  for (const row of rows) {
    const cell = row.cells.totalElectricity
    if (!row.hasExcel || cell.excel === null || cell.actual === null) continue
    excelSum += cell.excel
    actualSum += cell.actual
    data.push({
      date: row.date,
      label: formatDayMonth(row.date),
      excelRaw: excelSum,
      actualRaw: actualSum,
      excel: toUnit(excelSum, unit),
      actual: toUnit(actualSum, unit),
      days: data.length + 1,
    })
  }

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined
    if (!point) return null
    const diff = point.actualRaw - point.excelRaw
    const pct = point.excelRaw !== 0 ? (point.actualRaw / point.excelRaw - 1) * 100 : null
    const tone = evnPctTone(pct)

    return (
      <EvnTooltipBox
        title={`${dayjs(point.date).format('ddd DD/MM/YYYY')} · ${labels.charts.cumulativeDays(point.days)}`}
        items={[
          { label: labels.chart.excel, value: `${formatAmount(point.excelRaw, unit)} ${unit}`, color: colors.excel },
          { label: labels.chart.actual, value: `${formatAmount(point.actualRaw, unit)} ${unit}`, color: colors.actual },
          { label: labels.table.diff, value: `${formatAmountDiff(diff, unit)} ${unit}` },
          { label: labels.kpi.pct, value: formatPct(pct, 2), valueColor: tone ? evnToneColor(theme, tone) : undefined },
        ]}
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
            width={unit === 'kWh' ? 68 : 52}
            domain={[0, 'auto']}
            tickFormatter={(v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={renderTooltip} isAnimationActive={false} cursor={{ stroke: theme.palette.divider }} />
          <Line type="linear" dataKey="excel" stroke={colors.excel} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          <Line type="linear" dataKey="actual" stroke={colors.actual} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </EvnChartBox>
  )
}
