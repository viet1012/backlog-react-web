import { AccessTimeOutlined } from '@mui/icons-material'
import { PlaceholderPage } from '../components/common/PlaceholderPage'
import { useI18n } from '../i18n/useI18n'

export function OtPage() {
  const { t } = useI18n()

  return <PlaceholderPage title={t.nav.ot} subtitle={t.placeholder.ot} icon={AccessTimeOutlined} />
}
