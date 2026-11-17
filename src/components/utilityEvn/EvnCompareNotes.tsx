import { Box } from '@mui/material'
import { useI18n } from '../../i18n/useI18n'
import { EvnSection } from './EvnSection'

interface EvnCompareNotesProps {
  // ngưỡng độ phủ của BE (minCoveragePct)
  minCoveragePct: number | null
  excludedMeters: string[]
}

// Chú thích cố định về cách đọc số + quy tắc partial / meter bị loại theo BE
export function EvnCompareNotes({ minCoveragePct, excludedMeters }: EvnCompareNotesProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn.notes

  const lines = [
    ...labels.lines,
    ...(minCoveragePct !== null ? [labels.partialRule(minCoveragePct)] : []),
    ...(excludedMeters.length > 0 ? [labels.excludedMeters(excludedMeters.join(', '))] : []),
  ]

  return (
    <EvnSection title={labels.title}>
      <Box
        component="ul"
        sx={{
          m: 0,
          pl: 2.25,
          fontSize: 12.5,
          lineHeight: 1.6,
          color: 'text.secondary',
        }}
      >
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </Box>
    </EvnSection>
  )
}
