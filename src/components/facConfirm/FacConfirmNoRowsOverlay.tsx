import { Button } from '@mui/material'
import TodayRoundedIcon from '@mui/icons-material/TodayRounded'

import { FactoryNoRowsOverlay } from '../common/FactoryNoRowsOverlay'
import { FilteredEmptyState } from '../common/loadState'
import { useI18n } from '../../i18n/useI18n'


interface FacConfirmNoRowsOverlayProps {
  // Đang có bộ lọc (tìm, loại hàng, Heat Type, lọc cột) => "không tìm thấy" + Xóa bộ lọc
  filtered: boolean
  filterSummary?: string
  onClearFilters: () => void
  // Chỉ truyền khi Export Date khác hôm nay (vd mở link cũ) => nút "Về hôm nay"
  onGoToday?: () => void
}


// Cùng cảnh "ô kho trống" với các bảng khác.
// Link cũ / dữ liệu không còn: nói rõ bộ lọc không khớp, cho Xóa bộ lọc / Về hôm nay.
export function FacConfirmNoRowsOverlay({
  filtered,
  filterSummary,
  onClearFilters,
  onGoToday,
}: FacConfirmNoRowsOverlayProps) {
  const { t } = useI18n()

  const goToday = onGoToday && (
    <Button
      variant="outlined"
      size="small"
      startIcon={<TodayRoundedIcon />}
      onClick={onGoToday}
      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
    >
      {t.common.goToday}
    </Button>
  )

  if (filtered) {
    return (
      <FilteredEmptyState
        summary={filterSummary}
        onClearFilters={onClearFilters}
        extraAction={goToday}
      />
    )
  }

  return (
    <FactoryNoRowsOverlay
      title={t.facConfirm.noRowsTitle}
      hint={t.facConfirm.noRowsHint}
      action={goToday}
    />
  )
}
