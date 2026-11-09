import { ClearButton } from '../common/ClearButton'
import { FactoryNoRowsOverlay } from '../common/FactoryNoRowsOverlay'
import { useI18n } from '../../i18n/useI18n'


interface FacConfirmNoRowsOverlayProps {
  // Đang có bộ lọc cột => hiện nút Clear All
  hasFilters: boolean
  onClearFilters: () => void
}


// Cùng cảnh "ô kho trống" với các bảng khác, thêm lời nhắc + nút Clear All riêng của FAC Confirm
export function FacConfirmNoRowsOverlay({
  hasFilters,
  onClearFilters,
}: FacConfirmNoRowsOverlayProps) {
  const { t } = useI18n()

  return (
    <FactoryNoRowsOverlay
      title={t.facConfirm.noRowsTitle}
      hint={t.facConfirm.noRowsHint}
      action={hasFilters && (
        <ClearButton
          mode="clearAll"
          onClick={onClearFilters}
        />
      )}
    />
  )
}
