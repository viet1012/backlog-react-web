import { ReceiptLongOutlined } from '@mui/icons-material'
import { PlaceholderPage } from '../components/common/PlaceholderPage'
import { useI18n } from '../i18n/useI18n'

export function PlPage() {
  const { t } = useI18n()

  return <PlaceholderPage title={t.nav.pl} subtitle={t.placeholder.pl} icon={ReceiptLongOutlined} />
}
