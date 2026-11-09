import { Box, Stack, Tooltip, Typography, useTheme } from '@mui/material'
import type { AiLogDetail } from '../../types/assistantLogs'
import { useI18n } from '../../i18n/useI18n'
import { TABULAR_NUMS, buildTimeline, formatInt, type StepKind } from './aiLogsUtils'

const STEP_COLORS: Record<StepKind, { light: string; dark: string }> = {
  context: { light: '#64748B', dark: '#94A3B8' },
  askedMonths: { light: '#0F766E', dark: '#2DD4BF' },
  prefetch: { light: '#0891B2', dark: '#22D3EE' },
  prefetchTool: { light: '#D97706', dark: '#FBBF24' },
  llm: { light: '#7C3AED', dark: '#A78BFA' },
  tool: { light: '#D97706', dark: '#FBBF24' },
}

const GRID = '160px minmax(0, 1fr) 76px'

// Thanh thời gian kiểu Gantt: mỗi bước 1 dòng, vị trí = thời điểm bắt đầu, độ dài = thời lượng
export function AiLogTimeline({ detail }: { detail: AiLogDetail }) {
  const { t } = useI18n()
  const labels = t.aiLogs.detail
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const { steps, totalMs } = buildTimeline(detail, {
    context: labels.context,
    askedMonths: labels.askedMonths,
    prefetch: labels.prefetch,
    llm: labels.llm,
    tool: labels.tool,
  })

  if (steps.length === 0) {
    return (
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{labels.noTimeline}</Typography>
    )
  }

  const pct = (ms: number) => `${Math.min(100, (ms / totalMs) * 100)}%`

  return (
    <Stack sx={{ gap: 0.5 }}>
      {steps.map((step, i) => {
        const color = step.failed
          ? theme.palette.error.main
          : STEP_COLORS[step.kind][dark ? 'dark' : 'light']
        const nested = step.kind === 'prefetchTool'

        return (
          <Box
            key={`${step.kind}-${i}`}
            sx={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: 1 }}
          >
            <Typography
              noWrap
              title={step.label}
              sx={{
                fontSize: nested ? 11.5 : 12,
                fontWeight: nested ? 400 : 600,
                pl: nested ? 1.5 : 0,
                color: step.failed ? 'error.main' : nested ? 'text.secondary' : 'text.primary',
              }}
            >
              {step.label}
            </Typography>

            <Box sx={{ position: 'relative', height: nested ? 10 : 14, borderRadius: 0.75, bgcolor: 'action.hover' }}>
              <Tooltip title={`${step.label}: ${formatInt(step.ms)} ms`} placement="top">
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: pct(step.startMs),
                    width: pct(step.ms),
                    minWidth: 2,
                    borderRadius: 0.75,
                    bgcolor: color,
                    opacity: nested ? 0.75 : 1,
                  }}
                />
              </Tooltip>
            </Box>

            <Typography sx={{ ...TABULAR_NUMS, fontSize: nested ? 11.5 : 12, textAlign: 'right', color: nested ? 'text.secondary' : 'text.primary' }}>
              {`${formatInt(step.ms)} ms`}
            </Typography>
          </Box>
        )
      })}

      <Box
        sx={{ display: 'grid', gridTemplateColumns: GRID, gap: 1, pt: 0.5, borderTop: 1, borderColor: 'divider' }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{labels.total}</Typography>
        <Box />
        <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, fontWeight: 800, textAlign: 'right' }}>
          {`${formatInt(detail.totalMs ?? totalMs)} ms`}
        </Typography>
      </Box>

      <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{labels.timelineNote}</Typography>
    </Stack>
  )
}
