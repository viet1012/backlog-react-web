import { useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { useI18n } from '../../i18n/useI18n'
import type { UtilityMeterIssue } from '../../types/utilityEvn'
import { EVN_DASH, evnScopeLabel, formatDateRanges } from '../../utils/utilityEvnCompare'
import { EvnChartBox, EvnTooltipBox } from './EvnChartParts'
import { evnAxisTick, evnGridStroke } from './evnCompareUi'

// số đồng hồ tối đa trên biểu đồ (nhiều giờ thiếu nhất)
export const EVN_METER_CHART_LIMIT = 12

const ROW_HEIGHT = 26

interface EvnMeterHoursChartProps {
  issues: UtilityMeterIssue[]
  loading: boolean
}

interface Point {
  meter: string
  hours: number
  hoursLabel: string
  issue: UtilityMeterIssue
}

// Cột ngang: số giờ thiếu theo đồng hồ, màu theo mức độ (Nặng / Nhẹ)
export function EvnMeterHoursChart({ issues, loading }: EvnMeterHoursChartProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const theme = useTheme()
  const axisTick = evnAxisTick(theme)
  const severityLabels = labels.issues.severityLabels as Record<string, string | undefined>

  const data: Point[] = issues
    .filter((issue) => issue.missingHours !== null && issue.missingHours > 0)
    .sort((a, b) => (b.missingHours ?? 0) - (a.missingHours ?? 0))
    .slice(0, EVN_METER_CHART_LIMIT)
    .map((issue) => {
      const hours = Math.round((issue.missingHours ?? 0) * 10) / 10
      return { meter: issue.meter, hours, hoursLabel: labels.table.hours(hours), issue }
    })

  const severityColor = (severity: string | null) => {
    if (severity === 'MAJOR') return theme.palette.error.main
    if (severity === 'MINOR') return theme.palette.warning.main
    return alpha(theme.palette.text.secondary, 0.5)
  }

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined
    if (!point) return null
    const { issue } = point

    return (
      <EvnTooltipBox
        title={issue.meter}
        items={[
          { label: labels.issues.fac, value: evnScopeLabel(issue.fac) },
          {
            label: labels.issues.severity,
            value: issue.severity ? severityLabels[issue.severity] ?? issue.severity : EVN_DASH,
            color: severityColor(issue.severity),
          },
          { label: labels.issues.missingHours, value: point.hoursLabel },
          { label: labels.issues.dates, value: formatDateRanges(issue.dates) },
        ]}
      />
    )
  }

  return (
    <EvnChartBox
      height={Math.max(96, data.length * ROW_HEIGHT + 28)}
      loading={loading}
      empty={data.length === 0}
      emptyLabel={labels.issues.none}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 0 }} barCategoryGap={4}>
          <CartesianGrid horizontal={false} stroke={evnGridStroke(theme)} />
          <XAxis
            type="number"
            domain={[0, 'auto']}
            height={22}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="meter"
            width={150}
            tick={{ ...axisTick, fill: theme.palette.text.primary }}
            tickLine={false}
            axisLine={{ stroke: theme.palette.divider }}
          />
          <Tooltip content={renderTooltip} isAnimationActive={false} cursor={{ fill: alpha(theme.palette.text.primary, 0.05) }} />
          <Bar dataKey="hours" radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={false}>
            {data.map((point) => (
              <Cell key={point.meter} fill={severityColor(point.issue.severity)} />
            ))}
            <LabelList
              dataKey="hoursLabel"
              position="right"
              style={{ fontSize: 11, fill: theme.palette.text.secondary, fontVariantNumeric: 'tabular-nums' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </EvnChartBox>
  )
}
