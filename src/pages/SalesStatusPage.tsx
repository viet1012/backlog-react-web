import { Card, Typography } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'

import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { useI18n } from '../i18n/useI18n'

export function SalesStatusPage() {
  const { mode, setMode } = useColorScheme()
  const { t } = useI18n()

  return (
    <PageShell>
      <PageHeader
        title={t.placeholder.salesStatus}
        subtitle={t.placeholder.salesStatusSubtitle}
        mode={mode === 'light' ? 'light' : 'dark'}
        onToggleMode={() =>
          setMode(mode === 'dark' ? 'light' : 'dark')
        }
      />

      <Card sx={{ p: 2 }}>
        <Typography color="text.secondary">
          {t.placeholder.comingSoon}
        </Typography>
      </Card>
    </PageShell>
  )
}