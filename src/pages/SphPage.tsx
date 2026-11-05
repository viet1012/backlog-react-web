import { PrecisionManufacturingOutlined } from '@mui/icons-material'
import { PlaceholderPage } from '../components/common/PlaceholderPage'
import { useI18n } from '../i18n/useI18n'

export function SphPage() {
  const { t } = useI18n()

  return <PlaceholderPage title={t.nav.sph} subtitle={t.placeholder.sph} icon={PrecisionManufacturingOutlined} />
}
