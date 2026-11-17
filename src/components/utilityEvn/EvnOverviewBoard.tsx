import { Box, Stack, Typography, useTheme } from '@mui/material'
import { useI18n } from '../../i18n/useI18n'
import type { UtilityScopeCode } from '../../types/utilityEvn'
import {
  EVN_PCT_OK,
  EVN_PCT_WARN,
  EVN_SCOPE_LABEL,
  evnPctTone,
  formatPct,
  type EvnOverviewRow,
  type EvnScopeOverview,
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { EvnLegend, type EvnLegendItem } from './EvnChartParts'
import { EvnDailyLines } from './EvnDailyLines'
import { EvnMeterIssues } from './EvnMeterIssues'
import { EvnOverviewCards } from './EvnOverviewCards'
import { EvnOverviewPctChart } from './EvnOverviewPctChart'
import { EvnOverviewTable } from './EvnOverviewTable'
import { EvnSection } from './EvnSection'
import { EVN_PARTIAL_COLOR, TABULAR_NUMS, evnScopeColors, evnSeriesColors, evnToneColor } from './evnCompareUi'

interface EvnOverviewBoardProps {
  overview: EvnScopeOverview[]
  rows: EvnOverviewRow[]
  unit: EvnUnit
  crossUnit: EvnUnit
  loading: boolean
  onOpenScope: (code: UtilityScopeCode) => void
}

// Chế độ "Tổng quan": cả 3 phạm vi trên 1 màn, không cần chuyển tab
export function EvnOverviewBoard({ overview, rows, unit, crossUnit, loading, onOpenScope }: EvnOverviewBoardProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const theme = useTheme()
  const scopeColors = evnScopeColors(theme)
  const seriesColors = evnSeriesColors(theme)
  const scopes = overview.map((s) => s.code)

  const scopeLegend: EvnLegendItem[] = [
    ...scopes.map((code): EvnLegendItem => ({ label: EVN_SCOPE_LABEL[code], color: scopeColors[code], kind: 'line' })),
    { label: labels.chart.partial, color: EVN_PARTIAL_COLOR, kind: 'outline' },
    { label: `±${EVN_PCT_OK}% / ±${EVN_PCT_WARN}%`, color: theme.palette.text.disabled, kind: 'dash' },
  ]

  const seriesLegend: EvnLegendItem[] = [
    { label: `${labels.chart.excel} (${unit})`, color: seriesColors.excel, kind: 'line' },
    { label: `${labels.chart.actual} (${unit})`, color: seriesColors.actual, kind: 'line' },
    { label: labels.chart.partial, color: EVN_PARTIAL_COLOR, kind: 'dot' },
  ]

  // KVH gồm đồng hồ của mọi xưởng → danh sách cảnh báo toàn nhà máy
  const plant = overview.find((s) => s.code === 'KVH') ?? overview[0]

  return (
    <>
      <EvnOverviewCards
        overview={overview}
        unit={unit}
        crossUnit={crossUnit}
        loading={loading}
        onOpenScope={onOpenScope}
      />

      <EvnSection title={labels.overview.pctTitle} extra={<EvnLegend items={scopeLegend} />}>
        <EvnOverviewPctChart rows={rows} scopes={scopes} height={260} loading={loading} />
      </EvnSection>

      <EvnSection
        title={unit === 'kUSD' ? labels.overview.linesTitleMoney : labels.overview.linesTitle}
        extra={<EvnLegend items={seriesLegend} />}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          {overview.map((scope) => {
            const pct = scope.summary.totals.totalElectricity.pct
            return (
              <Box key={scope.code} sx={{ minWidth: 0 }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: scopeColors[scope.code] }} />
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{EVN_SCOPE_LABEL[scope.code]}</Typography>
                  {pct !== null && (
                    <Typography
                      sx={{ ...TABULAR_NUMS, fontSize: 12, fontWeight: 800, color: evnToneColor(theme, evnPctTone(pct)) }}
                    >
                      {formatPct(pct)}
                    </Typography>
                  )}
                </Stack>
                <EvnDailyLines rows={scope.rows} unit={unit} group="totalElectricity" height={200} loading={loading} />
              </Box>
            )
          })}
        </Box>
      </EvnSection>

      <EvnOverviewTable rows={rows} overview={overview} unit={unit} loading={loading} />

      <EvnMeterIssues
        issues={plant?.issues ?? []}
        estimatedMissingMwh={plant?.estimatedMissingMwh ?? null}
        loading={loading && overview.length === 0}
      />
    </>
  )
}
