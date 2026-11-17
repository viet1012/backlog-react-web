import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { Box, Button, Skeleton, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { uiTokens } from '../../theme/uiTokens'
import type { UtilityScopeCode } from '../../types/utilityEvn'
import {
  EVN_SCOPE_LABEL,
  evnPctTone,
  formatAmount,
  formatAmountDiff,
  formatPct,
  type EvnScopeOverview,
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { EVN_PARTIAL_COLOR, TABULAR_NUMS, evnScopeColors, evnToneColor } from './evnCompareUi'

interface EvnOverviewCardsProps {
  overview: EvnScopeOverview[]
  unit: EvnUnit
  crossUnit: EvnUnit
  loading: boolean
  // mở chế độ Bảng của phạm vi đó
  onOpenScope: (code: UtilityScopeCode) => void
}

function StatLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1.5, minWidth: 0 }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>{label}</Typography>
      <Box sx={{ ...TABULAR_NUMS, fontSize: 13, fontWeight: 700, textAlign: 'right', minWidth: 0 }}>{children}</Box>
    </Box>
  )
}

// 1 thẻ / phạm vi (KVH · Fac A&B · Fac C): tổng điện lưới trên ngày có Excel + tình trạng đồng hồ
export function EvnOverviewCards({ overview, unit, crossUnit, loading, onOpenScope }: EvnOverviewCardsProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const kpi = labels.kpi
  const theme = useTheme()
  const scopeColors = evnScopeColors(theme)

  const grid = {
    display: 'grid',
    gap: uiTokens.page.gap,
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' },
    flexShrink: 0,
  } as const

  if (overview.length === 0) {
    if (!loading) return null
    return (
      <Box sx={grid}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={228} />
        ))}
      </Box>
    )
  }

  return (
    <Box sx={grid}>
      {overview.map((scope) => {
        const total = scope.summary.totals.totalElectricity
        const cross = scope.cross.totals.totalElectricity
        const tone = evnPctTone(total.pct)
        const crossTone = evnPctTone(cross.pct)
        const avgTone = evnPctTone(scope.summary.avgPctFull)
        const majorCount = scope.issues.filter((issue) => issue.severity === 'MAJOR').length

        return (
          <Box
            key={scope.code}
            component="section"
            aria-label={EVN_SCOPE_LABEL[scope.code]}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
              px: 1.5,
              pt: 1,
              pb: 1,
              minWidth: 0,
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `3px solid ${scopeColors[scope.code]}`,
              borderRadius: uiTokens.card.borderRadius,
              bgcolor: 'background.paper',
            }}
          >
            {/* Phạm vi + % lệch tổng */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: scopeColors[scope.code] }} />
                <Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>
                  {EVN_SCOPE_LABEL[scope.code]}
                </Typography>
              </Stack>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  sx={{ ...TABULAR_NUMS, fontSize: 22, fontWeight: 800, lineHeight: 1.1, color: evnToneColor(theme, tone) }}
                >
                  {formatPct(total.pct, 2)}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{kpi.pctHint}</Typography>
              </Box>
            </Box>

            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: -0.25 }}>
              {kpi.onExcelDays(scope.summary.excelDays)}
            </Typography>

            <StatLine label={`${kpi.totalExcel} (${unit})`}>{formatAmount(total.excel, unit)}</StatLine>
            <StatLine label={`${kpi.totalActual} (${unit})`}>{formatAmount(total.actual, unit)}</StatLine>
            <StatLine label={`${kpi.diff} (${unit})`}>
              <Box component="span" sx={{ color: evnToneColor(theme, tone) }}>{formatAmountDiff(total.diff, unit)}</Box>
            </StatLine>

            <StatLine label={`${crossUnit === 'kUSD' ? kpi.moneyCross : kpi.energyCross} (${crossUnit})`}>
              {formatAmount(cross.excel, crossUnit)} / {formatAmount(cross.actual, crossUnit)}{' '}
              <Box component="span" sx={{ color: evnToneColor(theme, crossTone) }}>({formatPct(cross.pct)})</Box>
            </StatLine>

            <StatLine label={kpi.avgPctFull}>
              <Box component="span" sx={{ color: evnToneColor(theme, avgTone) }}>
                {formatPct(scope.summary.avgPctFull, 2)}
              </Box>
            </StatLine>

            <StatLine label={kpi.days}>
              <Box component="span" sx={{ color: 'success.main' }}>{scope.summary.excelDays}</Box>
              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}> {kpi.excelDays} · </Box>
              <Box component="span" sx={{ color: 'text.secondary' }}>{scope.summary.noExcelDays}</Box>
              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}> {kpi.noExcelDays} · </Box>
              <Box component="span" sx={{ color: EVN_PARTIAL_COLOR }}>{scope.summary.partialDays}</Box>
              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}> {labels.table.partial}</Box>
            </StatLine>

            <StatLine label={labels.issues.title}>
              {scope.issues.length === 0 ? (
                <Box component="span" sx={{ color: 'success.main' }}>0</Box>
              ) : (
                <>
                  {scope.issues.length}
                  {majorCount > 0 && (
                    <Box component="span" sx={{ color: 'error.main' }}>
                      {' '}({labels.overview.majorCount(majorCount)})
                    </Box>
                  )}
                </>
              )}
              {scope.estimatedMissingMwh !== null && scope.estimatedMissingMwh > 0 && (
                <Box component="span" sx={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'text.secondary' }}>
                  {labels.issues.estimatedMissing(formatAmount(scope.estimatedMissingMwh, 'MWh'))}
                </Box>
              )}
            </StatLine>

            <Box sx={{ mt: 'auto', pt: 0.25, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => onOpenScope(scope.code)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {labels.overview.openDetail}
              </Button>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
