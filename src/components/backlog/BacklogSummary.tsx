import { Box, Card, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { uiTokens } from '../../theme/uiTokens'
import type { ProductionOrder } from '../../types/report'

interface BacklogSummaryProps { data: ProductionOrder[]; totalElements: number }

export function BacklogSummary({ data, totalElements }: BacklogSummaryProps) {
  const summary = useMemo(() => {
    const statuses = data.map((order) => order.Status?.toUpperCase() ?? '')
    return {
      wip: statuses.filter((status) => status.includes('WIP')).length,
      waiting: statuses.filter((status) => status.includes('WAIT') || status === 'NYI').length,
      completed: statuses.filter((status) => status.includes('DONE') || status.includes('COMPLETE')).length,
    }
  }, [data])
  const items = [
    { label: 'Total Orders', value: totalElements, note: 'All matching orders', accent: '#60a5fa' },
    { label: 'WIP', value: summary.wip, note: 'Current page', accent: '#f59e0b' },
    { label: 'Waiting', value: summary.waiting, note: 'Current page', accent: '#38bdf8' },
    { label: 'Completed', value: summary.completed, note: 'Current page', accent: '#22c55e' },
  ]
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 1.5, mb: 0.5 }}>
      {items.map((item) => (
        <Card key={item.label} sx={{ px: 2, py: 1.2, borderTop: `2px solid ${item.accent}`, transition: 'transform 170ms ease, box-shadow 170ms ease', '&:hover': { transform: 'translateY(-1px)' } }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 3, height: 28, flex: '0 0 auto', borderRadius: '1px', bgcolor: item.accent }} />
            <Box>
              <Typography color="text.secondary" sx={{ fontSize: uiTokens.kpi.labelFontSize }}>{item.label}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                <Typography sx={{ fontSize: uiTokens.kpi.valueFontSize, fontWeight: 800 }}>{item.value.toLocaleString()}</Typography>
                <Typography color="text.disabled" sx={{ fontSize: uiTokens.kpi.secondaryFontSize }}>{item.note}</Typography>
              </Stack>
            </Box>
          </Stack>
        </Card>
      ))}
    </Box>
  )
}
