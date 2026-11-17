import { Box, Skeleton, Stack, Typography, useTheme } from '@mui/material'
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
import { useI18n } from '../../i18n/useI18n'
import {
  evnPctTone,
  formatDayMonth,
  formatAmount,
  formatAmountDiff,
  formatPct,
  toUnit,
  type EvnCompareRow,
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { EvnSection } from './EvnSection'
import { EVN_PARTIAL_COLOR, TABULAR_NUMS, evnToneColor } from './evnCompareUi'

interface EvnCompareChartProps {
  rows: EvnCompareRow[]
  unit: EvnUnit
  loading: boolean
  height?: number
}

interface ChartRow {
  date: string
  label: string
  // theo đơn vị đang chọn; excel = null → ngày chưa có Excel (đường Excel đứt)
  excel: number | null
  actual: number | null
  pct: number | null
  partial: boolean
  row: EvnCompareRow
}

interface DotRenderProps {
  cx?: number
  cy?: number
  index?: number
  payload?: ChartRow
}

// Line "Excel" vs "Thực tế" (tổng điện lưới, trục trái) + cột % lệch (trục phải)
export function EvnCompareChart({ rows, unit, loading, height = 260 }: EvnCompareChartProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn.chart
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const excelColor = dark ? '#60A5FA' : '#2563EB'
  const actualColor = dark ? '#34D399' : '#059669'
  const pctColor = alpha(theme.palette.text.secondary, dark ? 0.35 : 0.25)

  const data: ChartRow[] = rows.map((row) => {
    const cell = row.cells.totalElectricity
    return {
      date: row.date,
      label: formatDayMonth(row.date),
      excel: row.hasExcel ? toUnit(cell.excel, unit) : null,
      actual: toUnit(cell.actual, unit),
      pct: cell.pct,
      partial: row.partial,
      row,
    }
  })

  const axisTick = { fontSize: 11, fill: theme.palette.text.secondary, style: TABULAR_NUMS }

  // ngày partial: chấm cam to hơn trên đường thực tế
  const renderActualDot = (props: unknown) => {
    const { cx, cy, index, payload } = props as DotRenderProps
    const key = `dot-${index ?? 0}`
    if (cx == null || cy == null || !payload) return <g key={key} />

    return payload.partial ? (
      <circle key={key} cx={cx} cy={cy} r={4.5} fill={EVN_PARTIAL_COLOR} stroke={theme.palette.background.paper} strokeWidth={1.5} />
    ) : (
      <circle key={key} cx={cx} cy={cy} r={2.5} fill={actualColor} />
    )
  }

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const point = active ? (payload?.[0]?.payload as ChartRow | undefined) : undefined
    if (!point) return null
    const cell = point.row.cells.totalElectricity
    const tone = evnPctTone(cell.pct)

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
          minWidth: 180,
        }}
      >
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, mb: 0.25 }}>
          {dayjs(point.date).format('ddd DD/MM/YYYY')}
        </Typography>

        {[
          { label: labels.excel, value: point.row.hasExcel ? `${formatAmount(cell.excel, unit)} ${unit}` : labels.noExcel, color: excelColor },
          { label: labels.actual, value: `${formatAmount(cell.actual, unit)} ${unit}`, color: actualColor },
          { label: t.utilityEvn.table.diff, value: `${formatAmountDiff(cell.diff, unit)} ${cell.diff === null ? '' : unit}`, color: theme.palette.text.secondary },
          { label: t.utilityEvn.kpi.pct, value: formatPct(cell.pct, 2), color: theme.palette.text.secondary, valueColor: tone ? evnToneColor(theme, tone) : undefined },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box component="span" sx={{ color: item.color, fontWeight: 600 }}>{item.label}</Box>
            <Box component="span" sx={{ ...TABULAR_NUMS, color: item.valueColor, fontWeight: item.valueColor ? 700 : 400 }}>
              {item.value}
            </Box>
          </Box>
        ))}

        {point.partial && (
          <Typography sx={{ mt: 0.25, fontSize: 11, fontWeight: 700, color: EVN_PARTIAL_COLOR }}>
            {labels.partial}
          </Typography>
        )}
      </Box>
    )
  }

  const legend = [
    { label: `${labels.excel} (${unit})`, color: excelColor, kind: 'line' as const },
    { label: `${labels.actual} (${unit})`, color: actualColor, kind: 'line' as const },
    { label: labels.pct, color: pctColor, kind: 'bar' as const },
    { label: labels.partial, color: EVN_PARTIAL_COLOR, kind: 'dot' as const },
  ]

  return (
    <EvnSection
      title={unit === 'kUSD' ? labels.titleMoney : labels.title}
      extra={legend.map((item) => (
        <Stack key={item.label} direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
          {item.kind === 'line' && (
            <Box component="svg" width={14} height={8}>
              <line x1={0} y1={4} x2={14} y2={4} stroke={item.color} strokeWidth={2} />
            </Box>
          )}
          {item.kind === 'bar' && <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: item.color }} />}
          {item.kind === 'dot' && <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: item.color }} />}
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{item.label}</Typography>
        </Stack>
      ))}
    >
      <Box sx={{ height, position: 'relative' }}>
        {loading && data.length === 0 ? (
          <Skeleton variant="rounded" height="100%" />
        ) : data.length === 0 ? (
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
                yAxisId="energy"
                orientation="left"
                width={unit === 'kWh' ? 64 : 48}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => v.toLocaleString('en-US', { maximumFractionDigits: unit === 'kWh' ? 0 : 1 })}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                yAxisId="pct"
                orientation="right"
                width={44}
                // cột % luôn mọc từ 0
                domain={[(min: number) => Math.min(0, Math.floor(min)), (max: number) => Math.max(0, Math.ceil(max))]}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                content={renderTooltip}
                isAnimationActive={false}
                cursor={{ fill: alpha(theme.palette.text.primary, 0.05) }}
              />

              <ReferenceLine yAxisId="pct" y={0} stroke={theme.palette.divider} />

              <Bar yAxisId="pct" dataKey="pct" maxBarSize={14} isAnimationActive={false}>
                {data.map((point) => (
                  <Cell key={point.date} fill={point.partial ? alpha(EVN_PARTIAL_COLOR, 0.55) : pctColor} />
                ))}
              </Bar>

              <Line
                yAxisId="energy"
                type="linear"
                dataKey="excel"
                stroke={excelColor}
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: excelColor }}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />

              <Line
                yAxisId="energy"
                type="linear"
                dataKey="actual"
                stroke={actualColor}
                strokeWidth={2.5}
                dot={renderActualDot}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Box>
    </EvnSection>
  )
}
