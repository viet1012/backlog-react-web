import { FilterBar, FilterDateRange } from '../common/filterBar'
import { ShipmentLegend } from './ShipmentLegend'
import { AppButton } from '../common/AppButton'
import { useI18n } from '../../i18n/useI18n'

interface ShipmentFilterBarProps {
  fromD: string
  toD: string
  loading: boolean
  /** Khoảng đang áp dụng khác 2 tuần mặc định */
  filtered: boolean
  onRangeChange: (fromD: string, toD: string) => void
  onApply: () => void
  /** Về 2 tuần mặc định */
  onReset: () => void
}

export function ShipmentFilterBar({
  fromD, toD, loading, filtered, onRangeChange, onApply, onReset,
}: ShipmentFilterBarProps) {
  const { t } = useI18n()

  return (
    <FilterBar
      activeCount={filtered ? 1 : 0}
      onClear={onReset}
      trailing={<ShipmentLegend />}
    >
      <FilterDateRange
        from={fromD}
        to={toD}
        fromLabel={t.shipment.from}
        toLabel={t.shipment.to}
        onChange={onRangeChange}
      />
      <AppButton appearance="action" disabled={loading} onClick={onApply}>{t.common.apply}</AppButton>
    </FilterBar>
  )
}
