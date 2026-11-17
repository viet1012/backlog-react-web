import { Box, Typography, useTheme } from '@mui/material'
import { useI18n } from '../../i18n/useI18n'
import { uiTokens } from '../../theme/uiTokens'
import type { UtilityMeterIssue } from '../../types/utilityEvn'
import {
  EVN_PCT_OK,
  EVN_PCT_WARN,
  evnPctTone,
  formatAmount,
  formatPct,
  type EvnCompareRow,
  type EvnCompareSummary,
  type EvnGroupKey,
  type EvnScopeTotal,
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { EvnLegend, type EvnLegendItem } from './EvnChartParts'
import { EvnCoverageChart } from './EvnCoverageChart'
import { EvnCumulativeChart } from './EvnCumulativeChart'
import { EvnDailyLines } from './EvnDailyLines'
import { EVN_METER_CHART_LIMIT, EvnMeterHoursChart } from './EvnMeterHoursChart'
import { EvnPctChart } from './EvnPctChart'
import { EvnScopeChart } from './EvnScopeChart'
import { EvnSection } from './EvnSection'
import { EVN_PARTIAL_COLOR, TABULAR_NUMS, evnSeriesColors, evnToneColor } from './evnCompareUi'

interface EvnChartBoardProps {
  rows: EvnCompareRow[]
  summary: EvnCompareSummary
  unit: EvnUnit
  loading: boolean
  scopeTotals: EvnScopeTotal[]
  issues: UtilityMeterIssue[]
  minCoveragePct: number | null
  estimatedMissingMwh: number | null
}

// các khung giờ vẽ thành small multiples (tổng điện lưới đã có biểu đồ riêng)
const BAND_GROUPS: EvnGroupKey[] = ['normal', 'highPeak', 'lowPeak', 'solar']

const TWO_COLUMNS = {
  display: 'grid',
  gap: uiTokens.page.gap,
  gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' },
  flexShrink: 0,
} as const

// Chế độ "Biểu đồ": cùng dữ liệu với chế độ Bảng, mỗi biểu đồ 1 trục y
export function EvnChartBoard({
  rows,
  summary,
  unit,
  loading,
  scopeTotals,
  issues,
  minCoveragePct,
  estimatedMissingMwh,
}: EvnChartBoardProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const charts = labels.charts
  const theme = useTheme()
  const colors = evnSeriesColors(theme)

  const seriesLegend: EvnLegendItem[] = [
    { label: `${labels.chart.excel} (${unit})`, color: colors.excel, kind: 'line' },
    { label: `${labels.chart.actual} (${unit})`, color: colors.actual, kind: 'line' },
  ]
  const partialLegend: EvnLegendItem = { label: labels.chart.partial, color: EVN_PARTIAL_COLOR, kind: 'dot' }

  const pctLegend: EvnLegendItem[] = [
    { label: charts.toneOk(EVN_PCT_OK), color: evnToneColor(theme, 'ok'), kind: 'bar' },
    { label: charts.toneWarn(EVN_PCT_WARN), color: evnToneColor(theme, 'warn'), kind: 'bar' },
    { label: charts.toneBad(EVN_PCT_WARN), color: evnToneColor(theme, 'bad'), kind: 'bar' },
    { label: labels.chart.partial, color: EVN_PARTIAL_COLOR, kind: 'outline' },
  ]

  const severityLegend: EvnLegendItem[] = [
    { label: labels.issues.severityLabels.MAJOR, color: theme.palette.error.main, kind: 'bar' },
    { label: labels.issues.severityLabels.MINOR, color: theme.palette.warning.main, kind: 'bar' },
  ]

  const meterCount = issues.filter((i) => i.missingHours !== null && i.missingHours > 0).length

  const pctBadge = (pct: number | null) => {
    if (pct === null) return null
    const tone = evnPctTone(pct)
    return (
      <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, fontWeight: 800, color: evnToneColor(theme, tone) }}>
        {formatPct(pct)}
      </Typography>
    )
  }

  return (
    <>
      <EvnSection
        title={unit === 'kUSD' ? labels.chart.titleMoney : labels.chart.title}
        extra={<EvnLegend items={[...seriesLegend, partialLegend]} />}
      >
        <EvnDailyLines rows={rows} unit={unit} group="totalElectricity" height={260} loading={loading} />
      </EvnSection>

      <Box sx={TWO_COLUMNS}>
        <EvnSection title={charts.pctTitle} extra={<EvnLegend items={pctLegend} />}>
          <EvnPctChart rows={rows} unit={unit} height={240} loading={loading} />
        </EvnSection>

        <EvnSection
          title={charts.cumulativeTitle}
          extra={
            <>
              <EvnLegend items={seriesLegend} />
              {pctBadge(summary.totals.totalElectricity.pct)}
            </>
          }
        >
          <EvnCumulativeChart rows={rows} unit={unit} height={240} loading={loading} />
        </EvnSection>
      </Box>

      <EvnSection title={charts.bandsTitle} extra={<EvnLegend items={[...seriesLegend, partialLegend]} />}>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          {BAND_GROUPS.map((group) => (
            <Box key={group} sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.25 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{labels.table.groups[group]}</Typography>
                {pctBadge(summary.totals[group].pct)}
              </Box>
              <EvnDailyLines rows={rows} unit={unit} group={group} height={160} loading={loading} />
            </Box>
          ))}
        </Box>
      </EvnSection>

      <Box sx={TWO_COLUMNS}>
        <EvnSection
          title={charts.scopeTitle}
          extra={
            <EvnLegend
              items={[
                { label: `${labels.chart.excel} (${unit})`, color: colors.excel, kind: 'bar' },
                { label: `${labels.chart.actual} (${unit})`, color: colors.actual, kind: 'bar' },
              ]}
            />
          }
        >
          <EvnScopeChart scopes={scopeTotals} unit={unit} height={240} loading={loading} />
        </EvnSection>

        <EvnSection
          title={charts.coverageTitle}
          extra={
            <EvnLegend
              items={[
                { label: labels.table.coverage, color: colors.actual, kind: 'line' },
                partialLegend,
                ...(minCoveragePct !== null
                  ? [{ label: charts.coverageThreshold(minCoveragePct), color: theme.palette.text.secondary, kind: 'dash' as const }]
                  : []),
              ]}
            />
          }
        >
          <EvnCoverageChart rows={rows} minCoveragePct={minCoveragePct} height={240} loading={loading} />
        </EvnSection>
      </Box>

      <EvnSection
        title={charts.meterTitle}
        extra={
          <>
            <EvnLegend items={severityLegend} />
            {meterCount > EVN_METER_CHART_LIMIT && (
              <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary' }}>
                {charts.meterTop(EVN_METER_CHART_LIMIT, meterCount)}
              </Typography>
            )}
            {estimatedMissingMwh !== null && estimatedMissingMwh > 0 && (
              <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary' }}>
                {labels.issues.estimatedMissing(formatAmount(estimatedMissingMwh, 'MWh'))}
              </Typography>
            )}
          </>
        }
      >
        <EvnMeterHoursChart issues={issues} loading={loading && issues.length === 0} />
      </EvnSection>
    </>
  )
}
