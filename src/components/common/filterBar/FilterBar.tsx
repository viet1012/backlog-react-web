import type { ReactNode } from 'react'
import { Box, Chip, type SxProps, type Theme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded'

import { useI18n } from '../../../i18n/useI18n'
import { ClearButton } from '../ClearButton'
import { GlassPanel } from '../GlassPanel'

/**
 * Thanh bộ lọc dùng chung: các ô lọc bên trái, bên phải là nhãn "Đang lọc: N"
 * và nút "Xóa bộ lọc". Ô lọc dùng FilterSearch / FilterText / FilterSelect /
 * FilterDate / FilterDateRange (FilterControls.tsx) để mọi trang giống nhau.
 *
 * Bộ lọc nên được đồng bộ lên URL bằng useUrlFilters (hooks/useUrlFilters.ts).
 *
 * "Đang lọc" chỉ đếm bộ lọc thu hẹp dữ liệu (ô tìm, loại, trạng thái, lọc cột…),
 * không đếm phạm vi xem bắt buộc (Division, ngày xuất, công đoạn).
 */
interface FilterBarProps {
  children: ReactNode
  /** Số bộ lọc đang bật */
  activeCount: number
  /** Không truyền = không có nút Xóa bộ lọc */
  onClear?: () => void
  /** Nội dung sau nút Xóa (vd chú giải màu) */
  trailing?: ReactNode
  /** Dòng phụ bên dưới (vd chip từng bộ lọc) */
  footer?: ReactNode
  /** plain: không có khung kính (đặt trong header) */
  variant?: 'panel' | 'plain'
  tour?: string
  sx?: SxProps<Theme>
}

export function FilterBar({
  children,
  activeCount,
  onClear,
  trailing,
  footer,
  variant = 'panel',
  tour,
  sx,
}: FilterBarProps) {
  const { t } = useI18n()

  const content = (
    <>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 0.75,
          minWidth: 0,
        }}
      >
        {children}

        <Box sx={{ flex: '1 0 0', minWidth: 0 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          {activeCount > 0 && (
            <Chip
              size="small"
              icon={<FilterAltRoundedIcon />}
              label={t.common.activeFilterCount(activeCount)}
              sx={(theme) => ({
                height: 26,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                '& .MuiChip-icon': { color: 'inherit', fontSize: 16 },
              })}
            />
          )}

          {onClear && <ClearButton disabled={activeCount === 0} onClick={onClear} />}

          {trailing}
        </Box>
      </Box>

      {footer}
    </>
  )

  const extra = Array.isArray(sx) ? sx : sx ? [sx] : []

  if (variant === 'plain') {
    return (
      <Box data-tour={tour} sx={[{ py: 0.5 }, ...extra]}>
        {content}
      </Box>
    )
  }

  return (
    <Box data-tour={tour} sx={{ flexShrink: 0 }}>
      <GlassPanel sx={[{ p: 1 }, ...extra]}>
        {content}
      </GlassPanel>
    </Box>
  )
}
