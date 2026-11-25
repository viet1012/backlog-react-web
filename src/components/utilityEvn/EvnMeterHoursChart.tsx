import { useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from 'recharts'
import { ResponsiveContainer } from '../common/StableResponsiveContainer'

import type { TooltipContentProps, YAxisTickContentProps } from 'recharts'
import { useI18n } from '../../i18n/useI18n'
import type { UtilityMeterIssue } from '../../types/utilityEvn'
import { EVN_DASH, evnScopeLabel, formatDateRanges } from '../../utils/utilityEvnCompare'
import { EvnChartBox, EvnTooltipBox } from './EvnChartParts'
import {
  evnAxisTick,
  evnGridStroke,
  evnMeterMetricValue,
  formatEvnMeterEstimate as formatEstimate,
  type EvnMeterChartMetric,
} from './evnCompareUi'

// số đồng hồ tối đa trên biểu đồ (nhiều giờ thiếu nhất)
export const EVN_METER_CHART_LIMIT = 12

const ROW_HEIGHT = 26

// trục Y khi hiện xưởng: [chip xưởng] + tên đồng hồ (giữ ~150px cho tên như trước)
const FAC_CHIP_WIDTH = 54
const FAC_AXIS_WIDTH = 150 + FAC_CHIP_WIDTH + 8
const METER_NAME_MAX = 24

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

interface EvnMeterHoursChartProps {
  issues: UtilityMeterIssue[]
  loading: boolean
  metric?: EvnMeterChartMetric
  // số đồng hồ tối đa (nhiều nhất trước); Infinity = tất cả
  limit?: number
  emptyLabel?: string
  // hiện chip xưởng (Fac A / Fac B / Fac C) trước tên đồng hồ trên trục Y
  showFac?: boolean
  // giá trị cuối trục X; nhiều biểu đồ con (nhóm theo xưởng) dùng chung để so sánh được
  domainMax?: number
}

interface Point {
  meter: string
  hours: number
  hoursLabel: string
  issue: UtilityMeterIssue
}

const metricValue = evnMeterMetricValue

// Cột ngang: số giờ thiếu (hoặc ước tính mất) theo đồng hồ, màu theo mức độ (Nặng / Nhẹ)
export function EvnMeterHoursChart({
  issues,
  loading,
  metric = 'hours',
  limit = EVN_METER_CHART_LIMIT,
  emptyLabel,
  showFac = false,
  domainMax,
}: EvnMeterHoursChartProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const theme = useTheme()
  const axisTick = evnAxisTick(theme)
  const severityLabels = labels.issues.severityLabels as Record<string, string | undefined>

  // "hours"/"hoursLabel" giữ tên cũ nhưng là giá trị của metric đang chọn
  const data: Point[] = issues
    .filter((issue) => {
      const value = metricValue(issue, metric)
      return value !== null && value > 0
    })
    .sort((a, b) => (metricValue(b, metric) ?? 0) - (metricValue(a, metric) ?? 0))
    .slice(0, limit)
    .map((issue) => {
      const raw = metricValue(issue, metric) ?? 0
      if (metric === 'hours') {
        const hours = Math.round(raw * 10) / 10
        return { meter: issue.meter, hours, hoursLabel: labels.table.hours(hours), issue }
      }
      return { meter: issue.meter, hours: raw, hoursLabel: formatEstimate(raw), issue }
    })

  const severityColor = (severity: string | null) => {
    if (severity === 'MAJOR') return theme.palette.error.main
    if (severity === 'MINOR') return theme.palette.warning.main
    return alpha(theme.palette.text.secondary, 0.5)
  }

  const facByMeter = new Map(data.map((point) => [point.meter, evnScopeLabel(point.issue.fac)]))

  // chip xám trung tính (không tô màu để khỏi lẫn với màu mức độ đỏ / cam)
  const renderFacTick = ({ x, y, payload }: YAxisTickContentProps) => {
    const meter = String(payload?.value ?? '')
    const fac = facByMeter.get(meter) ?? EVN_DASH
    const chipX = -FAC_AXIS_WIDTH + 2

    return (
      <g transform={`translate(${x},${y})`}>
        <title>{`${fac} · ${meter}`}</title>
        <rect
          x={chipX}
          y={-8}
          width={FAC_CHIP_WIDTH}
          height={16}
          rx={8}
          fill={alpha(theme.palette.text.primary, 0.06)}
          stroke={theme.palette.divider}
        />
        <text
          x={chipX + FAC_CHIP_WIDTH / 2}
          y={0}
          dy="0.35em"
          textAnchor="middle"
          fontSize={10.5}
          fontWeight={700}
          fill={theme.palette.text.secondary}
        >
          {fac}
        </text>
        <text x={-6} y={0} dy="0.35em" textAnchor="end" fontSize={axisTick.fontSize} fill={theme.palette.text.primary}>
          {truncate(meter, METER_NAME_MAX)}
        </text>
      </g>
    )
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
          {
            label: labels.issues.missingHours,
            value: metric === 'hours'
              ? point.hoursLabel
              : issue.missingHours === null ? EVN_DASH : labels.table.hours(Math.round(issue.missingHours * 10) / 10),
          },
          ...(metric === 'hours'
            ? []
            : [{
                label: metric === 'mwh' ? labels.issues.estimatedMissingMwh : labels.issues.estimatedMissingKusd,
                value: point.hoursLabel,
              }]),
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
      emptyLabel={emptyLabel ?? labels.issues.none}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: metric === 'hours' ? 56 : 72, bottom: 0, left: 0 }} barCategoryGap={4}>
          <CartesianGrid horizontal={false} stroke={evnGridStroke(theme)} />
          <XAxis
            type="number"
            domain={[0, domainMax ?? 'auto']}
            height={22}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="meter"
            width={showFac ? FAC_AXIS_WIDTH : 150}
            tick={showFac ? renderFacTick : { ...axisTick, fill: theme.palette.text.primary }}
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
