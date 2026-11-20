import { Card, Typography } from '@mui/material'

import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { useI18n } from '../i18n/useI18n'

export function ExportListPage() {
  const { t } = useI18n()

  return (
    <PageShell>
      <PageHeader
        title={t.nav.exportList}
        subtitle={t.placeholder.exportList}
      />

      <Card sx={{ p: 2 }}>
        <Typography color="text.secondary">
          {t.placeholder.comingSoon}
        </Typography>
      </Card>
    </PageShell>
  )
}