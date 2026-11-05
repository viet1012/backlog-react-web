import { AssessmentOutlined } from '@mui/icons-material'
import { PlaceholderPage } from '../components/common/PlaceholderPage'
import { useI18n } from '../i18n/useI18n'

export function BosbPage() {
  const { t } = useI18n()

  return <PlaceholderPage title={t.nav.bosb} subtitle={t.placeholder.bosb} icon={AssessmentOutlined} />
}
