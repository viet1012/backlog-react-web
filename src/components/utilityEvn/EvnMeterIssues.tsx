import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { useI18n } from '../../i18n/useI18n'
import { appScrollbarSx } from '../../theme/scrollbarStyle'
import { uiTokens } from '../../theme/uiTokens'
import type { UtilityMeterIssue } from '../../types/utilityEvn'
import { EVN_DASH, evnScopeLabel, formatAmount, formatDateRanges } from '../../utils/utilityEvnCompare'
import { EvnSection } from './EvnSection'
import { EVN_PARTIAL_COLOR, TABULAR_NUMS } from './evnCompareUi'

interface EvnMeterIssuesProps {
  // đã lọc theo scope đang xem
  issues: UtilityMeterIssue[]
  estimatedMissingMwh: number | null
  loading: boolean
}

type Align = 'left' | 'center' | 'right'

export function EvnMeterIssues({ issues, estimatedMissingMwh, loading }: EvnMeterIssuesProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn.issues

  const columns: { key: string; label: string; width?: number; align: Align }[] = [
    { key: 'meter', label: labels.meter, width: 220, align: 'left' },
    { key: 'fac', label: labels.fac, width: 80, align: 'center' },
    { key: 'severity', label: labels.severity, width: 90, align: 'center' },
    { key: 'hours', label: labels.missingHours, width: 110, align: 'right' },
    { key: 'dates', label: labels.dates, align: 'left' },
  ]

  function severityLabel(severity: string | null) {
    if (!severity) return EVN_DASH
    return (labels.severityLabels as Record<string, string | undefined>)[severity] ?? severity
  }

  return (
    <EvnSection
      title={labels.title}
      extra={
        <>
          {issues.length > 0 && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, color: EVN_PARTIAL_COLOR }}>
              <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, fontWeight: 700 }}>{issues.length}</Typography>
            </Stack>
          )}
          {estimatedMissingMwh !== null && estimatedMissingMwh > 0 && (
            <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary' }}>
              {labels.estimatedMissing(formatAmount(estimatedMissingMwh, 'MWh'))}
            </Typography>
          )}
        </>
      }
    >
      {loading && issues.length === 0 ? (
        <Stack spacing={0.5}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={24} />
          ))}
        </Stack>
      ) : issues.length === 0 ? (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', py: 0.5 }}>{labels.none}</Typography>
      ) : (
        <Box
          sx={(theme) => ({
            maxHeight: 320,
            overflow: 'auto',
            ...appScrollbarSx,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: uiTokens.card.borderRadius,
          })}
        >
          <Box
            component="table"
            sx={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontSize: uiTokens.table.auxiliaryFontSize,
            }}
          >
            <Box component="thead">
              <Box component="tr">
                {columns.map((col) => (
                  <Box
                    key={col.key}
                    component="th"
                    scope="col"
                    sx={(theme) => ({
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      width: col.width,
                      height: uiTokens.table.headerHeight,
                      px: 0.75,
                      textAlign: col.align,
                      whiteSpace: 'nowrap',
                      fontWeight: 700,
                      color: 'text.secondary',
                      bgcolor: theme.palette.background.paper,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    {col.label}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box component="tbody">
              {issues.map((issue) => {
                const major = issue.severity === 'MAJOR'

                return (
                  <Box
                    component="tr"
                    key={issue.meter}
                    sx={(theme) => ({
                      '& > td': {
                        height: uiTokens.table.rowHeight,
                        px: 0.75,
                        py: 0.25,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                      '&:hover > td': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    })}
                  >
                    <Box component="td" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{issue.meter}</Box>
                    <Box component="td" sx={{ textAlign: 'center', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {evnScopeLabel(issue.fac)}
                    </Box>
                    <Box component="td" sx={{ textAlign: 'center' }}>
                      <Box
                        component="span"
                        sx={(theme) => {
                          const color = major ? theme.palette.error.main : theme.palette.warning.main
                          return {
                            display: 'inline-block',
                            px: 0.75,
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            lineHeight: '18px',
                            color: issue.severity ? color : 'text.disabled',
                            bgcolor: issue.severity ? alpha(color, 0.12) : undefined,
                          }
                        }}
                      >
                        {severityLabel(issue.severity)}
                      </Box>
                    </Box>
                    <Box
                      component="td"
                      sx={{ ...TABULAR_NUMS, textAlign: 'right', fontWeight: 700, color: major ? 'error.main' : EVN_PARTIAL_COLOR }}
                    >
                      {issue.missingHours === null ? EVN_DASH : t.utilityEvn.table.hours(Math.round(issue.missingHours * 10) / 10)}
                    </Box>
                    <Box component="td" sx={{ ...TABULAR_NUMS, color: 'text.secondary' }}>
                      {formatDateRanges(issue.dates)}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>
      )}
    </EvnSection>
  )
}
