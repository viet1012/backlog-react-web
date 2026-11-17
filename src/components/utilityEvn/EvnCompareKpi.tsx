import { Box, Skeleton, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { uiTokens } from '../../theme/uiTokens'
import {
  evnPctTone,
  formatAmount,
  formatAmountDiff,
  formatPct,
  type EvnCompareSummary,
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { EVN_PARTIAL_COLOR, TABULAR_NUMS, evnToneColor } from './evnCompareUi'

interface EvnCompareKpiProps {
  summary: EvnCompareSummary | null
  unit: EvnUnit
  // đối chiếu chéo: đang xem điện năng → thẻ tiền (kUSD); đang xem tiền → thẻ điện năng (MWh)
  cross: { summary: EvnCompareSummary | null; unit: EvnUnit }
  loading: boolean
}

interface KpiItem {
  key: string
  label: string
  value: ReactNode
  unit?: string
  sub?: string
  color?: string
}

// Thẻ tổng: chỉ tính các ngày đã có Excel
export function EvnCompareKpi({ summary, unit, cross, loading }: EvnCompareKpiProps) {
  const { t } = useI18n()
  const theme = useTheme()
  const labels = t.utilityEvn.kpi

  const total = summary?.totals.totalElectricity ?? null
  const solar = summary?.totals.solar ?? null
  const totalTone = evnPctTone(total?.pct ?? null)
  const avgTone = evnPctTone(summary?.avgPctFull ?? null)
  const onExcelDays = summary ? labels.onExcelDays(summary.excelDays) : undefined
  const crossTotal = cross.summary?.totals.totalElectricity ?? null

  const items: KpiItem[] = [
    {
      key: 'excel',
      label: labels.totalExcel,
      value: formatAmount(total?.excel ?? null, unit),
      unit,
      sub: onExcelDays,
    },
    {
      key: 'actual',
      label: labels.totalActual,
      value: formatAmount(total?.actual ?? null, unit),
      unit,
      sub: onExcelDays,
    },
    {
      key: 'diff',
      label: labels.diff,
      value: formatAmountDiff(total?.diff ?? null, unit),
      unit,
      color: evnToneColor(theme, totalTone),
    },
    {
      key: 'pct',
      label: labels.pct,
      value: formatPct(total?.pct ?? null, 2),
      sub: labels.pctHint,
      color: evnToneColor(theme, totalTone),
    },
    {
      key: 'cross',
      label: cross.unit === 'kUSD' ? labels.moneyCross : labels.energyCross,
      value: `${formatAmount(crossTotal?.excel ?? null, cross.unit)} / ${formatAmount(crossTotal?.actual ?? null, cross.unit)}`,
      unit: cross.unit,
      sub: crossTotal
        ? `${labels.diff}: ${formatAmountDiff(crossTotal.diff, cross.unit)} ${cross.unit} (${formatPct(crossTotal.pct, 2)})`
        : undefined,
    },
    {
      key: 'days',
      label: labels.days,
      value: summary && (
        <Stack direction="row" sx={{ alignItems: 'baseline', columnGap: 1.25, flexWrap: 'wrap' }}>
          {[
            { text: labels.excelDays, count: summary.excelDays, color: theme.palette.success.main },
            { text: labels.noExcelDays, count: summary.noExcelDays, color: theme.palette.text.secondary },
            { text: labels.partialDays, count: summary.partialDays, color: EVN_PARTIAL_COLOR },
          ].map((part) => (
            <Box key={part.text} sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}>
              <Box component="span" sx={{ ...TABULAR_NUMS, fontSize: uiTokens.kpi.valueFontSize, fontWeight: 800, color: part.color }}>
                {part.count}
              </Box>
              <Box component="span" sx={{ fontSize: 11.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {part.text}
              </Box>
            </Box>
          ))}
        </Stack>
      ),
    },
    {
      key: 'avg',
      label: labels.avgPctFull,
      value: formatPct(summary?.avgPctFull ?? null, 2),
      sub: summary ? labels.fullDays(summary.fullDays) : undefined,
      color: evnToneColor(theme, avgTone),
    },
    {
      key: 'solar',
      label: labels.solar,
      value: `${formatAmount(solar?.excel ?? null, unit)} / ${formatAmount(solar?.actual ?? null, unit)}`,
      unit,
      sub: formatPct(solar?.pct ?? null, 2),
    },
  ]

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 1,
        flexShrink: 0,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.key}
          sx={{
            px: 1.5,
            py: 1,
            minWidth: 0,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.5,
            bgcolor: 'background.paper',
          }}
        >
          <Typography noWrap title={item.label} sx={{ fontSize: uiTokens.kpi.labelFontSize, color: 'text.secondary' }}>
            {item.label}
          </Typography>

          {!summary && loading ? (
            <>
              <Skeleton width="70%" height={30} />
              <Skeleton width="45%" height={16} />
            </>
          ) : (
            <>
              {typeof item.value === 'string' || item.value == null ? (
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      ...TABULAR_NUMS,
                      fontSize: uiTokens.kpi.valueFontSize,
                      fontWeight: 800,
                      color: item.color ?? 'text.primary',
                    }}
                  >
                    {item.value ?? '–'}
                  </Typography>
                  {item.unit && (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{item.unit}</Typography>
                  )}
                </Box>
              ) : item.value}

              {item.sub && (
                <Typography noWrap sx={{ ...TABULAR_NUMS, fontSize: uiTokens.kpi.secondaryFontSize, color: 'text.secondary' }}>
                  {item.sub}
                </Typography>
              )}
            </>
          )}
        </Box>
      ))}
    </Box>
  )
}
