import { Card, Typography } from '@mui/material'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'

export function SalesStatusPage() {
  return (
    <PageShell>
      <PageHeader title="Sales Status" />
      <Card sx={{ p: 2 }}>
        <Typography color="text.secondary">
        Coming soon
        </Typography>
      </Card>
    </PageShell>
  )
}
