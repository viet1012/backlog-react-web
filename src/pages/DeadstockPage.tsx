import { DeleteSweepOutlined } from '@mui/icons-material'
import { PlaceholderPage } from '../components/common/PlaceholderPage'
import { useI18n } from '../i18n/useI18n'

export function DeadstockPage() {
  const { t } = useI18n()

  return <PlaceholderPage title={t.nav.deadstock} subtitle={t.placeholder.deadstock} icon={DeleteSweepOutlined} />
}
