import { InventoryOutlined } from '@mui/icons-material'
import { PlaceholderPage } from '../components/common/PlaceholderPage'
import { useI18n } from '../i18n/useI18n'

export function PackingListPage() {
  const { t } = useI18n()

  return <PlaceholderPage title={t.nav.packingList} subtitle={t.placeholder.packingList} icon={InventoryOutlined} />
}
