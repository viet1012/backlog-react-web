import { Box, Skeleton, Typography } from '@mui/material'
import type { AiLogStats } from '../../types/assistantLogs'
import { useI18n } from '../../i18n/useI18n'
import { TABULAR_NUMS, durationLevel, formatInt, formatSec } from './aiLogsUtils'

interface AiLogsKpiProps {
  stats: AiLogStats | null
  loading: boolean
}

type Tone = 'success.main' | 'warning.main' | 'error.main' | 'text.primary'

function toneOfDuration(ms: number | null): Tone {
  const level = durationLevel(ms)
  return level ? `${level}.main` : 'text.primary'
}

export function AiLogsKpi({ stats, loading }: AiLogsKpiProps) {
  const { t } = useI18n()
  const labels = t.aiLogs.kpi

  // errorRate BE đã là % (1 chữ số thập phân)
  const errorRate = stats?.errorRate ?? null

  const items: { label: string; value: string; sub?: string; tone: Tone }[] = [
    { label: labels.total, value: formatInt(stats?.totalQuestions ?? null), tone: 'text.primary' },
    {
      label: labels.errorRate,
      value: errorRate == null ? '–' : `${errorRate.toFixed(1)}%`,
      sub: stats ? labels.errors(stats.errorCount) : undefined,
      tone: errorRate != null && errorRate > 0 ? 'error.main' : 'text.primary',
    },
    {
      label: labels.avg,
      value: formatSec(stats?.avgMs ?? null),
      sub: labels.seconds,
      tone: toneOfDuration(stats?.avgMs ?? null),
    },
    {
      label: labels.p95,
      value: formatSec(stats?.p95Ms ?? null),
      sub: labels.seconds,
      tone: toneOfDuration(stats?.p95Ms ?? null),
    },
  ]

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
        gap: 1,
        flexShrink: 0,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            px: 1.5,
            py: 1,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.5,
            bgcolor: 'background.paper',
          }}
        >
          <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {item.label}
          </Typography>

          {!stats && loading ? (
            <Skeleton width={80} height={32} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
              <Typography sx={{ ...TABULAR_NUMS, fontSize: 22, fontWeight: 800, color: item.tone }}>
                {item.value}
              </Typography>
              {item.sub && (
                <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary' }}>
                  {item.sub}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}
