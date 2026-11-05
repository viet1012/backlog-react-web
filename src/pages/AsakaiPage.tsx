import { FactoryOutlined } from '@mui/icons-material'
import { PlaceholderPage } from '../components/common/PlaceholderPage'
import { useI18n } from '../i18n/useI18n'

export function AsakaiPage() {
  const { t } = useI18n()

  return <PlaceholderPage title={t.nav.asakai} subtitle={t.placeholder.asakai} icon={FactoryOutlined} />
}
