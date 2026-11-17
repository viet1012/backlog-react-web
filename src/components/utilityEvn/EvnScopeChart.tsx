import { useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { useI18n } from '../../i18n/useI18n'
import {
  EVN_SCOPE_LABEL,
  evnPctTone,
  formatAmount,
  formatAmountDiff,
  formatPct,
  toUnit,
  type EvnScopeTotal,
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { EvnChartBox, EvnTooltipBox } from './EvnChartParts'
import { evnAxisTick, evnGridStroke, evnSeriesColors, evnToneColor } from './evnCompareUi'

interface EvnScopeChartProps {
  scopes: EvnScopeTotal[]
  unit: EvnUnit
  height: number
  loading: boolean
}

interface Point {
  label: string
  excel: number | null
  actual: number | null
  pctLabel: string
  scope: EvnScopeTotal
}

// Cột nhóm Excel / Thực tế (tổng điện lưới, ngày có Excel) cho KVH · Fac A&B · Fac C; nhãn % trên cột Thực tế
export function EvnScopeChart({ scopes, unit, height, loading }: EvnScopeChartProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const theme = useTheme()
  const colors = evnSeriesColors(theme)
  const axisTick = evnAxisTick(theme)

  const data: Point[] = scopes.map((scope) => ({
    label: EVN_SCOPE_LABEL[scope.code],
    excel: toUnit(scope.total.excel, unit),
    actual: toUnit(scope.total.actual, unit),
    pctLabel: scope.total.pct === null ? '' : formatPct(scope.total.pct),
    scope,
  }))

  const empty = data.every((p) => p.excel === null && p.actual === null)

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined
    if (!point) return null
    const cell = point.scope.total
    const tone = evnPctTone(cell.pct)

    return (
      <EvnTooltipBox
        title={`${point.label} · ${labels.table.totalHint(point.scope.excelDays)}`}
        items={[
          { label: labels.chart.excel, value: `${formatAmount(cell.excel, unit)} ${unit}`, color: colors.excel },
          { label: labels.chart.actual, value: `${formatAmount(cell.actual, unit)} ${unit}`, color: colors.actual },
          { label: labels.table.diff, value: `${formatAmountDiff(cell.diff, unit)}${cell.diff === null ? '' : ` ${unit}`}` },
          { label: labels.kpi.pct, value: formatPct(cell.pct, 2), valueColor: tone ? evnToneColor(theme, tone) : undefined },
        ]}
      />
    )
  }

  return (
    <EvnChartBox height={height} loading={loading} empty={empty} emptyLabel={labels.chart.empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={evnGridStroke(theme)} />
          <XAxis dataKey="label" height={22} tick={{ ...axisTick, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: theme.palette.divider }} />
          <YAxis
            width={unit === 'kWh' ? 68 : 52}
            domain={[0, 'auto']}
            tickFormatter={(v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={renderTooltip} isAnimationActive={false} cursor={{ fill: alpha(theme.palette.text.primary, 0.05) }} />
          <Bar dataKey="excel" fill={colors.excel} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} />
          <Bar dataKey="actual" fill={colors.actual} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false}>
            <LabelList
              dataKey="pctLabel"
              position="top"
              style={{ fontSize: 11, fontWeight: 700, fill: theme.palette.text.secondary, fontVariantNumeric: 'tabular-nums' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </EvnChartBox>
  )
}
