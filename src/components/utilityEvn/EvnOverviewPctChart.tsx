import { Box, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { useI18n } from '../../i18n/useI18n'
import type { UtilityScopeCode } from '../../types/utilityEvn'
import {
  EVN_PCT_OK,
  EVN_PCT_WARN,
  EVN_SCOPE_LABEL,
  evnPctTone,
  formatDayMonth,
  formatPct,
  type EvnOverviewRow,
} from '../../utils/utilityEvnCompare'
import { EvnChartBox, EvnTooltipBox } from './EvnChartParts'
import { EVN_PARTIAL_COLOR, evnAxisTick, evnGridStroke, evnScopeColors, evnToneColor } from './evnCompareUi'

interface EvnOverviewPctChartProps {
  rows: EvnOverviewRow[]
  scopes: UtilityScopeCode[]
  height: number
  loading: boolean
}

type Point = {
  date: string
  label: string
  row: EvnOverviewRow
} & Partial<Record<UtilityScopeCode, number | null>>

interface DotRenderProps {
  cx?: number
  cy?: number
  index?: number
  payload?: Point
}

// % lệch điện lưới theo ngày của cả 3 phạm vi trên 1 trục (chỉ ngày có Excel)
export function EvnOverviewPctChart({ rows, scopes, height, loading }: EvnOverviewPctChartProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const theme = useTheme()
  const scopeColors = evnScopeColors(theme)
  const axisTick = evnAxisTick(theme)
  const thresholdStroke = theme.palette.text.disabled

  const data: Point[] = rows.flatMap((row) => {
    const point: Point = { date: row.date, label: formatDayMonth(row.date), row }
    let any = false
    for (const code of scopes) {
      const scopeRow = row.byScope[code]
      const pct = scopeRow?.hasExcel ? scopeRow.cells.totalElectricity.pct : null
      point[code] = pct
      if (pct !== null) any = true
    }
    return any ? [point] : []
  })

  // ngày partial của phạm vi đó: chấm rỗng viền cam
  const dotFor = (code: UtilityScopeCode) => (props: unknown) => {
    const { cx, cy, index, payload } = props as DotRenderProps
    const key = `${code}-dot-${index ?? 0}`
    if (cx == null || cy == null || !payload || payload[code] == null) return <g key={key} />
    return payload.row.byScope[code]?.partial ? (
      <circle key={key} cx={cx} cy={cy} r={4} fill={theme.palette.background.paper} stroke={EVN_PARTIAL_COLOR} strokeWidth={2} />
    ) : (
      <circle key={key} cx={cx} cy={cy} r={2.5} fill={scopeColors[code]} />
    )
  }

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined
    if (!point) return null

    return (
      <EvnTooltipBox
        title={dayjs(point.date).format('ddd DD/MM/YYYY')}
        items={scopes.map((code) => {
          const pct = point[code] ?? null
          const partial = point.row.byScope[code]?.partial ?? false
          const tone = evnPctTone(pct)
          return {
            label: `${EVN_SCOPE_LABEL[code]}${partial ? ` · ${labels.table.partial}` : ''}`,
            value: pct === null ? labels.chart.noExcel : formatPct(pct, 2),
            color: scopeColors[code],
            valueColor: tone ? evnToneColor(theme, tone) : undefined,
          }
        })}
      />
    )
  }

  return (
    <EvnChartBox height={height} loading={loading} empty={data.length === 0} emptyLabel={labels.chart.empty}>
      <Box sx={{ height: '100%' }}>
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
              axisLine={false}
            />
            <YAxis
              width={44}
              domain={[
                (min: number) => Math.min(-EVN_PCT_WARN, Math.floor(min)),
                (max: number) => Math.max(EVN_PCT_OK, Math.ceil(max)),
              ]}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={renderTooltip} isAnimationActive={false} cursor={{ stroke: theme.palette.divider }} />

            {[EVN_PCT_WARN, -EVN_PCT_WARN, EVN_PCT_OK, -EVN_PCT_OK].map((y) => (
              <ReferenceLine key={y} y={y} stroke={thresholdStroke} strokeDasharray="4 3" />
            ))}
            <ReferenceLine y={0} stroke={theme.palette.divider} />

            {scopes.map((code) => (
              <Line
                key={code}
                type="linear"
                dataKey={code}
                name={EVN_SCOPE_LABEL[code]}
                stroke={scopeColors[code]}
                strokeWidth={2}
                dot={dotFor(code)}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </EvnChartBox>
  )
}
