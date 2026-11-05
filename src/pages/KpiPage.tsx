import { SpeedOutlined } from '@mui/icons-material'
import { PlaceholderPage } from '../components/common/PlaceholderPage'
import { useI18n } from '../i18n/useI18n'

export function KpiPage() {
  const { t } = useI18n()

  return <PlaceholderPage title={t.nav.kpi} subtitle={t.placeholder.kpi} icon={SpeedOutlined} />
}
