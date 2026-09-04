import { Card, Typography } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'

import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'

export function ExportListPage() {
  const { mode, setMode } = useColorScheme()

  return (
    <PageShell>
      <PageHeader
        title="Export List"
        subtitle="Export management"
        mode={mode === 'light' ? 'light' : 'dark'}
        onToggleMode={() =>
          setMode(mode === 'dark' ? 'light' : 'dark')
        }
      />

      <Card sx={{ p: 2 }}>
        <Typography color="text.secondary">
          Coming soon
        </Typography>
      </Card>
    </PageShell>
  )
}