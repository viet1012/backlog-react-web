import { Box, Stack, Typography, useTheme } from '@mui/material'
import { seriesColorOf } from './costChartConfig'
import { buildFormulas, type ExampleValues } from './costMonitoringGuide'
import { useI18n } from '../../i18n/useI18n'

const monoSx = {
  fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  fontSize: 14,
  lineHeight: 1.6,
}

// Thẻ công thức: tên + ý nghĩa → công thức (mono) → thay số theo ngày d → kết quả tô đúng màu đường
export function CostGuideFormulas({ values }: { values: ExampleValues }) {
  const { t } = useI18n()

  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const statusColor = {
    ok: theme.palette.success.main,
    watch: theme.palette.warning.main,
    over: theme.palette.error.main,
  }

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontSize: 15, fontWeight: 800, mt: 1 }}>
        {t.costGuide.formulas.title}
      </Typography>

      {buildFormulas(t, values).map((f, i) => {
        const color = f.tone === 'ok' || f.tone === 'watch' || f.tone === 'over'
          ? statusColor[f.tone]
          : seriesColorOf(f.tone, dark)

        return (
          <Box
            key={f.title}
            sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.paper' }}
          >
            <Typography sx={{ fontSize: 15, fontWeight: 800 }}>
              {i + 1}. {f.title}
            </Typography>

            <Typography sx={{ fontSize: 14, lineHeight: 1.6, mb: 1 }} color="text.secondary">
              {f.meaning}
            </Typography>

            <Box sx={{ ...monoSx, px: 1.25, py: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
              {f.formula.map((line) => (
                <Box key={line}>{line}</Box>
              ))}
            </Box>

            <Box sx={{ ...monoSx, mt: 0.75, px: 1.25 }}>
              {f.substitution} ={' '}
              <Box component="span" sx={{ fontWeight: 800, color }}>
                {f.result}
              </Box>
              {f.resultNote && (
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {' '}{f.resultNote}
                </Box>
              )}
            </Box>

            {f.tip && (
              <Typography sx={{ fontSize: 14, lineHeight: 1.6, mt: 0.75, fontStyle: 'italic' }} color="text.secondary">
                {f.tip}
              </Typography>
            )}
          </Box>
        )
      })}
    </Stack>
  )
}
